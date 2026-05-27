package com.badminton.ecommerce.modules.deal.service.impl;

import com.badminton.ecommerce.core.exception.AppException;
import com.badminton.ecommerce.core.exception.ErrorCode;
import com.badminton.ecommerce.modules.deal.entity.CrawlLog;
import com.badminton.ecommerce.modules.deal.entity.DealSource;
import com.badminton.ecommerce.modules.deal.repository.CrawlLogRepository;
import com.badminton.ecommerce.modules.deal.repository.DealRepository;
import com.badminton.ecommerce.modules.deal.repository.DealSourceRepository;
import com.badminton.ecommerce.modules.deal.service.CrawlerEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrawlerEngineServiceImpl implements CrawlerEngineService {

    private final DealSourceRepository dealSourceRepository;
    private final CrawlLogRepository crawlLogRepository;
    private final DealRepository dealRepository;

    // Lưu trữ trạng thái tiến trình đang chạy để tránh chạy trùng lặp
    private final ConcurrentHashMap<UUID, Boolean> runningCrawlers = new ConcurrentHashMap<>();

    @Value("${crawler.auto-run:false}")
    private boolean autoRunEnabled;

    @Override
    @Async
    public void triggerManualCrawl(UUID sourceId, Integer overrideScrolls) {
        DealSource source = dealSourceRepository.findById(sourceId)
                .orElseThrow(() -> new AppException(ErrorCode.DEAL_NOT_FOUND));

        if (!source.isActive()) {
            throw new IllegalArgumentException("Không thể quét nguồn đang bị vô hiệu hóa.");
        }

        int scrolls = overrideScrolls != null ? overrideScrolls : source.getMaxScrolls();
        executeCrawlerProcess(source, scrolls);
    }

    @Override
    @Scheduled(fixedDelay = 60000) // Chạy mỗi 60 giây kiểm tra
    public void scheduleAutoCrawl() {
        if (!autoRunEnabled) {
            return;
        }

        List<DealSource> activeSources = dealSourceRepository.findByActiveTrue();
        Instant now = Instant.now();

        for (DealSource source : activeSources) {
            boolean isDue = false;
            if (source.getLastCrawledAt() == null) {
                isDue = true;
            } else {
                long minutesSinceLastCrawl = ChronoUnit.MINUTES.between(source.getLastCrawledAt(), now);
                if (minutesSinceLastCrawl >= source.getCrawlFrequencyMinutes()) {
                    isDue = true;
                }
            }

            if (isDue) {
                log.info("Nguồn {} (ID: {}) đã đến lịch quét.", source.getName(), source.getId());
                // Chạy Async để không block vòng lặp Scheduled
                triggerManualCrawl(source.getId(), null);
            }
        }
    }

    @Async
    protected void executeCrawlerProcess(DealSource source, int scrolls) {
        if (runningCrawlers.putIfAbsent(source.getId(), true) != null) {
            log.warn("Nguồn {} đang được cào, bỏ qua lệnh mới để tránh tràn RAM.", source.getId());
            return;
        }

        long startTime = System.currentTimeMillis();
        Instant startInstant = Instant.now();
        String status = "success";
        String errorMsg = null;
        List<String> dealJsons = new ArrayList<>();

        try {
            log.info("Bắt đầu kích hoạt Crawler Node.js cho nguồn {}", source.getId());
            
            // Lệnh chạy crawler (Giả sử thư mục crawler nằm ở gốc dự án)
            ProcessBuilder pb = new ProcessBuilder(
                    "npm.cmd", "run", "start", "--",
                    "--sourceId", source.getId().toString(),
                    "--url", source.getUrl(),
                    "--scrolls", String.valueOf(scrolls)
            );
            
            // Đường dẫn tuyệt đối tới thư mục crawler
            pb.directory(new File("crawler"));
            pb.redirectErrorStream(true); // Gộp error stream vào input stream

            Process process = pb.start();

            // Đọc log từ Node.js và bắt các dòng DEAL_JSON
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    log.info("[Crawler {}] {}", source.getId(), line);
                    
                    // Bắt các dòng chứa JSON payload đã push vào DB
                    if (line.contains("DEAL_JSON:")) {
                        String jsonPart = line.substring(line.indexOf("DEAL_JSON:") + "DEAL_JSON:".length()).trim();
                        dealJsons.add(jsonPart);
                    }
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                status = "failed";
                errorMsg = "Crawler thoát với mã lỗi: " + exitCode;
                log.error("Crawler cho {} bị lỗi (Exit code: {})", source.getId(), exitCode);
            } else {
                log.info("Crawler cho {} hoàn thành thành công.", source.getId());
                // Cập nhật thời gian quét cuối nếu thành công
                source.setLastCrawledAt(Instant.now());
                dealSourceRepository.save(source);
            }

        } catch (Exception e) {
            log.error("Lỗi khi khởi chạy tiến trình Crawler cho {}", source.getId(), e);
            status = "failed";
            errorMsg = e.getMessage();
        } finally {
            // Xóa cờ đang chạy
            runningCrawlers.remove(source.getId());

            // Lưu log vào DB
            long duration = System.currentTimeMillis() - startTime;
            Instant endInstant = Instant.now();
            saveCrawlLog(source, status, errorMsg, duration, startInstant, endInstant, dealJsons);
        }
    }

    private void saveCrawlLog(DealSource source, String status, String errorMsg, long durationMs, Instant startInstant, Instant endInstant, List<String> dealJsons) {
        long postsNew = dealRepository.countBySourceIdAndCreatedAtBetween(source.getId(), startInstant, endInstant);
        long postsTouched = dealRepository.countBySourceIdAndUpdatedAtBetween(source.getId(), startInstant, endInstant);
        long postsDuplicate = Math.max(0, postsTouched - postsNew);
        
        // Gộp tất cả JSON của deals vào 1 chuỗi phân cách bằng dấu xuống dòng
        String crawlDetails = dealJsons.isEmpty() ? null : "[" + String.join(",\n", dealJsons) + "]";
        
        CrawlLog logEntry = CrawlLog.builder()
                .source(source)
                .status(status)
                .errorMessage(errorMsg)
                .crawlDetails(crawlDetails)
                .durationMs((int) durationMs)
                .postsFound((int) postsTouched)
                .postsNew((int) postsNew)
                .postsDuplicate((int) postsDuplicate)
                .build();
        crawlLogRepository.save(logEntry);
    }
}

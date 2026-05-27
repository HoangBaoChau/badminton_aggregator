package com.badminton.ecommerce.modules.deal.service;

import java.util.UUID;

public interface CrawlerEngineService {
    void triggerManualCrawl(UUID sourceId, Integer overrideScrolls);
    
    // Phương thức chạy ngầm định kỳ
    void scheduleAutoCrawl();
}

package com.badminton.ecommerce.modules.system.service;

import com.badminton.ecommerce.modules.system.entity.SystemConfig;
import com.badminton.ecommerce.modules.system.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;

    /**
     * Lấy giá trị cấu hình theo key. Nếu không có thì trả về defaultValue.
     */
    public String getConfig(String key, String defaultValue) {
        return systemConfigRepository.findByConfigKey(key)
                .map(SystemConfig::getConfigValue)
                .orElse(defaultValue);
    }

    /**
     * Cập nhật hoặc tạo mới một cấu hình
     */
    @Transactional
    public SystemConfig updateConfig(String key, String value, String description) {
        SystemConfig config = systemConfigRepository.findByConfigKey(key).orElseGet(() -> {
            SystemConfig newConfig = new SystemConfig();
            newConfig.setConfigKey(key);
            return newConfig;
        });

        config.setConfigValue(value);
        if (description != null) {
            config.setDescription(description);
        }
        
        log.info("Cập nhật SystemConfig [{}] thành [{}]", key, value);
        return systemConfigRepository.save(config);
    }
}

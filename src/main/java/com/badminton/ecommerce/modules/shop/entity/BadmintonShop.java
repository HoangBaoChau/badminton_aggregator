package com.badminton.ecommerce.modules.shop.entity;

import com.badminton.ecommerce.core.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "badminton_shops")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BadmintonShop extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(length = 100)
    private String brand;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String address;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    @Builder.Default
    private String city = "Hà Nội";

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 50)
    private String phone;

    @Column(length = 255)
    private String website;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "shop_type", length = 50)
    @Builder.Default
    private String shopType = "shop";

    @Column(length = 20)
    @Builder.Default
    private String status = "active";
}

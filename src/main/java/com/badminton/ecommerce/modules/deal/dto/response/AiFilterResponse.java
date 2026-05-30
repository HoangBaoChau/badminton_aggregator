package com.badminton.ecommerce.modules.deal.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiFilterResponse implements Serializable {
    private String keyword;
    private String productType; // vợt, giày, quần áo, v.v.
    private String brand;       // yonex, victor, lining, mizuno...
    private String location;
    private String transactionMethod; // ban, mua
    private String condition;         // new, likenew, used
    private Integer minPrice;
    private Integer maxPrice;
    
    // Fallback constructor
    public static AiFilterResponse fallback(String originalQuery) {
        return AiFilterResponse.builder()
                .keyword(originalQuery)
                .build();
    }
}

package com.badminton.ecommerce.modules.identity.event;

import com.badminton.ecommerce.modules.identity.entity.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class UserRegistrationEvent extends ApplicationEvent {

    private final User user;

    public UserRegistrationEvent(Object source, User user) {
        super(source);
        this.user = user;
    }
}
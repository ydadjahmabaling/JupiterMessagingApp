package com.jupiter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JupiterApplication {
    public static void main(String[] args) { SpringApplication.run(JupiterApplication.class, args); }
}

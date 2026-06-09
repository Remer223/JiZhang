package org.example.accountbookserver.util;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import javax.imageio.ImageIO;

public class CaptchaUtil {

    private static final Map<String, String> CAPTCHA_STORE = new ConcurrentHashMap<>();
    private static final int WIDTH = 120;
    private static final int HEIGHT = 40;
    private static final int EXPIRE_SECONDS = 300;

    private CaptchaUtil() {}

    public static CaptchaResult generate() {
        String code = randomCode(4);
        String key = UUID.randomUUID().toString();
        CAPTCHA_STORE.put(key, code);
        scheduleExpire(key);

        String base64Image = generateImage(code);
        return new CaptchaResult(key, "data:image/png;base64," + base64Image);
    }

    public static boolean verify(String key, String input) {
        if (key == null || input == null) return false;
        String code = CAPTCHA_STORE.remove(key);
        return code != null && code.equalsIgnoreCase(input);
    }

    private static String randomCode(int len) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random r = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(r.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private static String generateImage(String code) {
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        g.setColor(new Color(240, 240, 240));
        g.fillRect(0, 0, WIDTH, HEIGHT);

        Random r = new Random();
        for (int i = 0; i < 20; i++) {
            g.setColor(new Color(r.nextInt(180), r.nextInt(180), r.nextInt(180)));
            int x1 = r.nextInt(WIDTH), y1 = r.nextInt(HEIGHT);
            int x2 = r.nextInt(WIDTH), y2 = r.nextInt(HEIGHT);
            g.drawLine(x1, y1, x2, y2);
        }

        g.setFont(new Font("Arial", Font.BOLD, 24));
        for (int i = 0; i < code.length(); i++) {
            g.setColor(new Color(r.nextInt(100), r.nextInt(100), r.nextInt(100)));
            int x = 10 + i * 26 + r.nextInt(5);
            int y = 28 + r.nextInt(6);
            g.drawString(String.valueOf(code.charAt(i)), x, y);
        }

        g.dispose();

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("生成验证码图片失败", e);
        }
    }

    private static void scheduleExpire(String key) {
        new Thread(() -> {
            try {
                Thread.sleep(EXPIRE_SECONDS * 1000L);
                CAPTCHA_STORE.remove(key);
            } catch (InterruptedException ignored) {
            }
        }).start();
    }

    public static class CaptchaResult {
        private final String key;
        private final String image;

        CaptchaResult(String key, String image) {
            this.key = key;
            this.image = image;
        }

        public String getKey() { return key; }
        public String getImage() { return image; }
    }
}

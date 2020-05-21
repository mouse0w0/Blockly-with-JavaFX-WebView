package com.mouse0w0.fxblockly.util;

import java.io.*;

public class FileUtils {
    public static String loadAllString(File file) {
        if (!file.exists())
            return "";

        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line + "\r\n");
            }
        } catch (IOException ignored) {
        }
        return builder.toString();
    }

    public static void save(File file, String str) {
        if (!file.getParentFile().exists())
            file.getParentFile().mkdirs();

        if (!file.exists())
            try {
                file.createNewFile();
            } catch (IOException ignored) {
            }

        try (FileWriter writer = new FileWriter(file)) {
            writer.write(str);
        } catch (IOException ignored) {
        }
    }
}

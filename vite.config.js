import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.js",
      userscript: {
        name: "雨课堂作业批改助手",
        version: process.env.npm_package_version,
        description: "雨课堂作业批改助手",
        author: "hotwords123",
        namespace: "npm/vite-plugin-monkey",
        match: ["https://pro.yuketang.cn/subject*"],
      },
    }),
  ],
});

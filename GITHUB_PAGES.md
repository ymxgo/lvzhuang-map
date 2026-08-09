# GitHub Pages 发布说明

本项目保留原有 Sites 构建，同时提供独立的 GitHub Pages 静态构建。

## 首次发布

1. 在 GitHub 创建一个 Public 仓库，例如 `lvzhuang-map`。
2. 将本项目推送到仓库的 `main` 分支。
3. 打开仓库的 `Settings → Pages`，在 `Build and deployment` 中选择 `GitHub Actions`。
4. 打开仓库的 `Actions` 页面，等待 `Deploy GitHub Pages` 运行完成。

访问地址通常是：

```text
https://你的GitHub用户名.github.io/仓库名/
```

以后每次推送到 `main` 分支，网站都会自动重新构建并发布。

## 数据与用途提醒

- GitHub Free 的免费 Pages 通常使用公开仓库，项目源代码和收录的案例数据也会公开。
- 当前预约店铺明确标记为功能演示，不会向真实商家发送信息。
- GitHub Pages 适合公开展示和产品原型；正式接入商家预约、账户、数据库或支付后，应使用支持服务端能力的托管平台。

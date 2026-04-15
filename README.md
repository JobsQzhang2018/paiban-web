# 排版工坊

一个可直接部署到 GitHub Pages、再通过 `iframe` 嵌入博客站的 Markdown 排版工具。

## 当前功能

- Markdown 编辑
- 实时预览
- 4 套排版主题
- 平台风格切换
- 本地自动保存
- 导入 Markdown 文件
- 复制预览 HTML
- 导出长图 PNG
- 文章元信息表单
- Webhook 一键发布到博客后台

## 部署方式

这是一个纯静态项目，不需要 Node 构建。

把以下文件上传到 GitHub 仓库根目录或任意静态目录：

- `index.html`
- `app.css`
- `app.js`

然后在 GitHub 仓库开启 GitHub Pages。

## 发布到博客后台

前端会向你填写的“博客发布接口”发送一个 `POST` 请求。

请求头：

```http
Content-Type: application/json
Authorization: Bearer <你填写的访问令牌>
```

请求体示例：

```json
{
  "title": "文章标题",
  "slug": "post-slug",
  "author": "作者名",
  "excerpt": "摘要",
  "tags": ["排版", "博客"],
  "cover": "https://example.com/cover.jpg",
  "markdown": "# Markdown 正文",
  "html": "<h1>渲染后的 HTML</h1>",
  "platform": "blog",
  "theme": "paper",
  "createdAt": "2026-04-15T08:00:00.000Z"
}
```

建议你的博客后台成功时返回：

```json
{
  "ok": true,
  "url": "https://your-blog.com/posts/post-slug"
}
```

## 嵌入博客

```html
<iframe
  src="https://你的用户名.github.io/你的仓库名/"
  width="100%"
  height="920"
  style="border:0;border-radius:16px;overflow:hidden;"
  loading="lazy">
</iframe>
```

## 后续建议

如果你后面要接入博客后台，可以继续加这些能力：

- 登录后保存草稿到你的博客数据库
- 发布前校验 slug 是否重复
- 自定义主题保存
- 图片上传到你自己的图床
- front matter 字段表单化

# ✦ Trợ Lý AI — Dành cho người đi làm

App trợ lý AI cá nhân tích hợp: Chat AI, Quản lý việc làm, Công cụ văn phòng, Giải trí, Kết nối đa AI.

---

## 🚀 Deploy lên Vercel (3 bước)

### Bước 1 — Upload lên GitHub
1. Vào **github.com/new** → tạo repo tên `ai-assistant`
2. Chọn **Private** (để bảo mật)
3. Upload toàn bộ thư mục này lên (kéo thả hoặc dùng GitHub Desktop)

### Bước 2 — Kết nối Vercel
1. Vào **vercel.com** → Add New Project
2. Chọn repo `ai-assistant` vừa tạo → Import
3. Vào **Environment Variables** → thêm:
   - Key: `VITE_ANTHROPIC_KEY`
   - Value: `sk-ant-xxxx` (API key của bạn từ console.anthropic.com)
4. Nhấn **Deploy** → chờ ~1 phút

### Bước 3 — Dùng thôi! 🎉
Vercel sẽ cho bạn link dạng: `https://ai-assistant-xxx.vercel.app`

---

## 🔑 Lấy Anthropic API Key
1. Vào **console.anthropic.com**
2. Đăng ký / đăng nhập
3. API Keys → Create Key → Copy

---

## ⚠️ Lưu ý bảo mật
- File `.env` đã được chặn trong `.gitignore` — KHÔNG bao giờ upload lên GitHub
- Trên Vercel, key được lưu an toàn trong Environment Variables
- Chỉ dùng cá nhân → không share link cho người khác để tránh tốn credit

---

## 💻 Chạy local (tuỳ chọn)
```bash
npm install
cp .env.example .env
# Điền API key vào file .env
npm run dev
```
Mở trình duyệt: http://localhost:5173

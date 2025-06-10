const jsonServer = require("json-server");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

// Cấu hình thư mục lưu file
const uploadDir = path.join(__dirname, "files");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Cấu hình multer để xử lý file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Lưu file vào thư mục 'files'
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Middleware mặc định của json-server
server.use(middlewares);

// Route xử lý upload file
server.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Tạo URL cho file
  const fileUrl = `/files/${req.file.filename}`;

  // Cập nhật db.json (ví dụ: thêm vào userProofs hoặc userCertificates)
  const db = router.db; // Truy cập db.json
  const { userId, type } = req.body; // Giả sử bạn gửi userId và type (proof/certificate) trong body

  if (!userId || !type) {
    return res.status(400).json({ error: "userId and type are required" });
  }

  // Thêm vào mảng tương ứng trong db.json
  const collection = type === "proof" ? "userProofs" : "userCertificates";
  const newEntry = {
    id: `${type}_${Date.now()}`, // Tạo ID duy nhất
    userId,
    fileUrl,
    fileName: req.file.originalname,
    uploadDate: new Date().toISOString(),
  };

  db.get(collection).push(newEntry).write();

  res.json({
    message: "File uploaded successfully",
    fileUrl,
    data: newEntry,
  });
});

// Route để truy cập file
server.use("/files", jsonServer.defaults({ static: "./files" }));

// Sử dụng router của json-server
server.use(router);

// Khởi động server
server.listen(3000, () => {
  console.log("JSON Server is running on port 3000");
});

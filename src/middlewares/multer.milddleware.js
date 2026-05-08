// import multer from "multer";

// const storage = multer.diskStorage({
//     destination:function (req,file,cb){
//         cb(null, './public/temp')
//     },
//     filename:function (req,file,cb){
//         //const uniqueSuffix = Date.now()+'-'+Math.round(Math.random()*1E9)
//         cb(null,file.originalname)
//     }
// })

// export const upload = multer({storage:storage})

import multer from "multer";
import fs from "fs";
import path from "path";

const tempDir = path.join(process.cwd(), "public/temp");

// Create folder if missing
if (!fs.existsSync(tempDir)) {
fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
destination: function (req, file, cb) {
cb(null, tempDir);
},

filename: function (req, file, cb) {
cb(null, `${Date.now()}-${file.originalname}`);
}
});

export const upload = multer({
storage,
limits: {
fileSize: 100 * 1024 * 1024 // 100MB
}
});


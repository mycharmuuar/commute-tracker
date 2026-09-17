#!/bin/bash
# Script สำหรับ Push ขึ้น GitHub และเตรียมความพร้อม Deploy

echo "=================================================="
echo "🚀 Commute Tracker - Git & Deploy Helper Script"
echo "=================================================="

# ตรวจสอบความปลอดภัยของ API Key ก่อน Push
echo ""
echo "🔍 1. กำลังตรวจสอบความปลอดภัยของ API Key..."
LEAK_CHECK=$(git log -p | grep "AIzaSy")

if [ -n "$LEAK_CHECK" ]; then
  echo "❌ ตรวจพบ API Key ใน Git History! ยกเลิกการ Push เพื่อความปลอดภัย"
  exit 1
else
  echo "✅ ปลอดภัย 100%: ไม่พบ API Key หรือไฟล์ .env ใน Git History"
fi

# ตรวจสอบ Remote URL
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null)

if [ -z "$CURRENT_REMOTE" ]; then
  echo ""
  echo "📌 ยังไม่มีการเชื่อมต่อกับ GitHub Repository"
  echo "กรุณาสร้าง Repository ที่ https://github.com/new"
  read -p "ใส่ GitHub Repo URL ของคุณ (เช่น https://github.com/CHARMUAR-DEV/commute-tracker.git): " REPO_URL
  
  if [ -n "$REPO_URL" ]; then
    git remote add origin "$REPO_URL"
    echo "✅ เชื่อมต่อ Remote: $REPO_URL เรียบร้อยแล้ว"
  else
    echo "❌ ไม่ได้ระบุ URL ยกเลิกการทำงาน"
    exit 1
  fi
else
  echo ""
  echo "🔗 Remote ปัจจุบันคือ: $CURRENT_REMOTE"
fi

# ทำการ Push ขึ้น GitHub
echo ""
echo "📤 2. กำลัง Push โค้ดขึ้น GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 Push ขึ้น GitHub สำเร็จเรียบร้อยแล้ว!"
  echo ""
  echo "🌐 ขั้นตอนถัดไปในการ Deploy บน Vercel:"
  echo "1. เข้าไปที่ https://vercel.com/new"
  echo "2. เลือก Import จาก Repo commute-tracker"
  echo "3. ตั้ง Root Directory เป็น: frontend"
  echo "4. ใส่ Environment Variable: VITE_GOOGLE_MAPS_API_KEY และ VITE_BACKEND_URL"
  echo "5. กด Deploy ได้ทันที!"
else
  echo ""
  echo "❌ เกิดข้อผิดพลาดในการ Push กรุณาตรวจสอบสิทธิ์ของ GitHub Token หรือ SSH Key"
fi

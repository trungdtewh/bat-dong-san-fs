# Hệ thống FS Dòng Tiền Bất Động Sản Việt Nam

## Ngôn ngữ

- Toàn bộ giao diện người dùng phải bằng tiếng Việt.
- Menu bằng tiếng Việt.
- Dashboard bằng tiếng Việt.
- Form nhập liệu bằng tiếng Việt.
- Báo cáo bằng tiếng Việt.
- Định dạng tiền tệ mặc định là VND.

## Quy tắc code

- Code bằng tiếng Anh.
- Database bằng tiếng Anh.
- Prisma schema bằng tiếng Anh.
- Function bằng tiếng Anh.
- Component bằng tiếng Anh.
- Tên biến, tên hàm, tên file dùng tiếng Anh.
- Không hardcode công thức tài chính trong React component.
- Công thức tài chính đặt trong src/lib/finance.
- Logic database đặt trong src/lib/db.
- Validation đặt trong src/lib/validations.

## Mục tiêu

Xây dựng phần mềm Financial Schedule (FS) cho dự án bất động sản tại Việt Nam.

## Modules

- Tổng quan
- Dự án
- Kịch bản
- Giả định
- Chi phí đất
- Chi phí xây dựng
- Doanh thu
- Vốn vay
- Dòng tiền
- Dashboard
- Báo cáo

## Loại hình dự án

- Chung cư
- Đất nền
- Nhà phố
- Shophouse
- Biệt thự
- Khu đô thị
- Khu công nghiệp
- Mixed-use

## KPI

- Doanh thu
- Tổng chi phí
- Lợi nhuận
- IRR
- NPV
- ROI
- Thời gian hoàn vốn
- Peak Funding Requirement
## Quy tắc ngôn ngữ bắt buộc

Tất cả nội dung trả lời phải bằng tiếng Việt.

Chỉ được sử dụng tiếng Anh cho:

- Tên model Prisma
- Tên bảng database
- Tên field database
- Tên enum
- Tên function
- Đoạn code

Không sử dụng tiếng Anh trong:

- Tiêu đề
- Mô tả
- Giải thích
- Bảng phân tích
- Tài liệu thiết kế
- Tài liệu nghiệp vụ
- Roadmap
- User story
- Dashboard mô tả

Ví dụ:

Sai:
- CollectionSchedule sử dụng JSON
- Audit Trail
- Cross-project analysis

Đúng:
- Tiến độ thu tiền (CollectionSchedule) sử dụng JSON
- Nhật ký kiểm toán
- Phân tích liên dự án
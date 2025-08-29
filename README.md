# Ground Control Station (GCS) - EIU FABLAB

Ứng dụng Ground Control Station cho drone sử dụng PyQt6 và web frontend.

## 🏗️ Cấu Trúc Dự Án

### Backend (Python)
```
app/
├── main.py              # Entry point chính
├── control.py           # Controller cho LoRa communication
├── lora_bridge.py       # Bridge giữa Python và JavaScript
└── ui/
    └── main.ui          # PyQt6 UI file
```

### Frontend (Web)
```
web/
├── index.html           # Main HTML file (đã được refactor)
├── views/               # 📁 Các view components riêng biệt
│   ├── plan.html        # Mission planning view
│   ├── fly.html         # Flight monitoring view
│   ├── setup.html       # Vehicle setup view
│   └── settings.html    # Application settings view
├── js/
│   ├── main.js          # Main JavaScript logic
│   ├── view-manager.js  # 🆕 Quản lý dynamic loading views
│   ├── bridge.js        # Qt WebChannel bridge
│   ├── mission.js       # Mission planning logic
│   ├── telemetry.js     # Telemetry handling
│   ├── map-core.js      # Map functionality
│   ├── config.js        # Configuration
│   └── utils.js         # Utility functions
└── assets/
    ├── css/
    │   ├── styles.css   # Main styles
    │   └── views.css    # 🆕 View-specific styles
    ├── img/             # Images
    └── vendor/          # Third-party libraries
```

## 🚀 Tính Năng Chính

### 1. **Plan View** 🗺️
- Mission planning với bản đồ
- Vẽ polyline/polygon
- Thêm/xóa waypoints
- Upload/download missions

### 2. **Fly View** ✈️
- Flight monitoring
- Real-time telemetry
- Flight controls (Arm/Disarm, Takeoff, Land, RTL)
- Position tracking (Local ENU / GPS WGS84)

### 3. **Setup View** 🛠️
- Vehicle configuration
- Firmware management
- Sensor calibration
- Flight mode setup

### 4. **Settings View** ⚙️
- Application preferences
- Communication links
- Offline maps
- MAVLink configuration

## 🔧 Cách Sử Dụng

### Chạy Ứng Dụng
```bash
# Từ thư mục gốc
cd ground_gui
python -m app.main
```

### Phát Triển Views

#### Thêm View Mới
1. Tạo file HTML trong `web/views/`
```html
<!-- web/views/new-view.html -->
<section id="view-new-view" class="view-pane">
  <div class="sb__section">
    <div class="sb__title">New View</div>
    <!-- Your content here -->
  </div>
</section>
```

2. Đăng ký trong `view-manager.js`
```javascript
// Trong init() method
this.registerView('new-view', './views/new-view.html');

// Trong initViewLogic() method
case 'new-view':
  this.initNewView();
  break;
```

3. Thêm navigation button trong `index.html`
```html
<button class="nav-btn nav-btn--xl" data-view="new-view">
  <span class="nav-ic">🆕</span> <span>New View</span>
</button>
```

#### Chỉnh Sửa View Hiện Tại
- Chỉ cần edit file HTML tương ứng trong `web/views/`
- Không cần sửa `index.html`
- View sẽ tự động reload khi chuyển đổi

## 🎨 Styling

### CSS Classes Chính
- `.view-pane` - Container cho mỗi view
- `.sb__section` - Section container
- `.sb__title` - Section title
- `.btn` - Button styles với variants
- `.grid-2`, `.grid-3` - Grid layouts
- `.menu-list`, `.menu-item` - Menu components

### Responsive Design
- Mobile-first approach
- Grid layouts tự động adjust
- Touch-friendly controls

## 🔌 API & Bridge

### Qt WebChannel
- `bridge.startConnection()` - Kết nối LoRa
- `bridge.stopConnection()` - Ngắt kết nối
- `bridge.landConnect()` - Gửi lệnh Land
- `bridge.offBoardConnect()` - Gửi lệnh Offboard

### Telemetry Data
- Position updates (local & GPS)
- Battery status
- Speed & altitude
- Link status

## 🚀 Lợi Ích Của Cấu Trúc Mới

### ✅ **Modular Design**
- Mỗi view có file riêng biệt
- Dễ dàng thêm/sửa/xóa views
- Không ảnh hưởng đến views khác

### ✅ **Maintainability**
- Code được tổ chức rõ ràng
- Dễ debug và troubleshoot
- Separation of concerns

### ✅ **Scalability**
- Thêm view mới chỉ cần 2-3 bước
- Không cần sửa file chính
- Reusable components

### ✅ **Performance**
- Views chỉ load khi cần
- Lazy loading cho content
- Optimized rendering

## 🐛 Troubleshooting

### HTTP Server Error
```bash
# Kiểm tra port 8000 có bị chiếm không
netstat -an | findstr :8000

# Kill process nếu cần
taskkill /F /PID <PID>
```

### Module Import Error
```bash
# Luôn chạy từ thư mục gốc
python -m app.main

# Không chạy trực tiếp
# python app/main.py  ❌
```

### View Loading Error
- Kiểm tra console browser
- Đảm bảo file HTML tồn tại
- Kiểm tra network tab

## 📝 Changelog

### v2.0.0 - Modular Views
- ✅ Refactor thành modular view system
- ✅ Dynamic view loading
- ✅ Separate CSS cho views
- ✅ Improved navigation
- ✅ Better error handling

### v1.0.0 - Initial Release
- ✅ Basic GCS functionality
- ✅ LoRa communication
- ✅ Map integration
- ✅ Mission planning

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

---

**EIU FABLAB** - Ground Control Station v2.0.0

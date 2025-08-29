// view-manager.js - Quản lý việc load và chuyển đổi giữa các view
class ViewManager {
  constructor() {
    this.currentView = null;
    this.views = new Map();
    this.viewContainer = document.getElementById('view-container');
  }

  async init() {
    console.log('ViewManager: Initializing...');
    
    // Đăng ký các view
    await this.registerView('plan', './views/plan.html');
    await this.registerView('fly', './views/fly.html');
    await this.registerView('setup', './views/setup.html');
    await this.registerView('settings', './views/settings.html');

    // Bind navigation events
    this.bindNavigation();
    
    // Load view mặc định
    await this.showView('plan');
    
    console.log('ViewManager: Initialization complete');
  }

  async registerView(name, htmlPath) {
    try {
      const response = await fetch(htmlPath);
      const html = await response.text();
      this.views.set(name, html);
      console.log(`ViewManager: View ${name} registered successfully`);
    } catch (error) {
      console.error(`ViewManager: Failed to load view ${name}:`, error);
      // Fallback HTML nếu load thất bại
      this.views.set(name, `<div class="sb__section"><div class="sb__title">Error</div><p>Failed to load ${name} view</p></div>`);
    }
  }

  async showView(viewName) {
    console.log(`ViewManager: Attempting to show view: ${viewName}`);
    
    if (!this.views.has(viewName)) {
      console.error(`ViewManager: View ${viewName} not found`);
      return;
    }

    // Ẩn tất cả views trước
    this.hideAllViews();

    // Hiển thị view mới
    this.viewContainer.innerHTML = this.views.get(viewName);
    
    // Cập nhật trạng thái
    this.currentView = viewName;
    
    // Cập nhật navigation
    this.updateNavigation(viewName);
    
    // Khởi tạo view-specific logic
    this.initViewLogic(viewName);
    
    console.log(`ViewManager: Successfully switched to ${viewName} view`);
  }

  hideAllViews() {
    console.log('ViewManager: Hiding all views');
    // Ẩn tất cả views
    this.viewContainer.innerHTML = '';
    this.currentView = null;
  }

  toggleView(viewName) {
    console.log(`ViewManager: Toggling view: ${viewName}, current: ${this.currentView}`);
    
    if (this.currentView === viewName) {
      // Nếu đang hiện view này thì ẩn đi
      this.hideAllViews();
      this.updateNavigation(null);
      console.log(`ViewManager: Hidden ${viewName} view`);
    } else {
      // Nếu không thì hiện view này
      this.showView(viewName);
    }
  }

  updateNavigation(activeView) {
    console.log(`ViewManager: Updating navigation, active: ${activeView}`);
    
    // Cập nhật trạng thái active của các nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === activeView) {
        btn.classList.add('active');
        console.log(`ViewManager: Set ${activeView} as active`);
      }
    });
  }

  bindNavigation() {
    console.log('ViewManager: Binding navigation events...');
    
    const navButtons = document.querySelectorAll('.nav-btn');
    console.log(`ViewManager: Found ${navButtons.length} navigation buttons`);
    
    navButtons.forEach((btn, index) => {
      const viewName = btn.dataset.view;
      console.log(`ViewManager: Binding button ${index + 1}: ${viewName}`);
      
      btn.addEventListener('click', async (e) => {
        console.log(`ViewManager: Button clicked: ${viewName}`);
        e.preventDefault();
        e.stopPropagation();
        
        if (viewName) {
          await this.toggleView(viewName);
        }
      });
    });
    
    console.log('ViewManager: Navigation events bound');
  }

  initViewLogic(viewName) {
    console.log(`ViewManager: Initializing logic for view: ${viewName}`);
    
    switch (viewName) {
      case 'plan':
        this.initPlanView();
        break;
      case 'fly':
        this.initFlyView();
        break;
      case 'setup':
        this.initSetupView();
        break;
      case 'settings':
        this.initSettingsView();
        break;
    }
  }

  initPlanView() {
    // Khởi tạo logic cho Plan view
    console.log('ViewManager: Initializing Plan view...');
    
    // Bind các button events
    const addStepBtn = document.getElementById('addStepBtn');
    const sendMissionBtn = document.getElementById('sendMissionBtn');
    const downloadMissionBtn = document.getElementById('downloadMissionBtn');
    
    if (addStepBtn) {
      addStepBtn.addEventListener('click', () => {
        console.log('Add waypoint clicked');
        // Logic thêm waypoint
      });
    }
    
    if (sendMissionBtn) {
      sendMissionBtn.addEventListener('click', () => {
        console.log('Send mission clicked');
        // Logic gửi mission
      });
    }
    
    if (downloadMissionBtn) {
      downloadMissionBtn.addEventListener('click', () => {
        console.log('Download mission clicked');
        // Logic download mission
      });
    }
  }

  initFlyView() {
    // Khởi tạo logic cho Fly view
    console.log('ViewManager: Initializing Fly view...');
    
    // Bind các button events
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const armBtn = document.getElementById('armBtn');
    const disarmBtn = document.getElementById('disarmBtn');
    
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        console.log('Connect clicked');
        // Logic kết nối
      });
    }
    
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        console.log('Disconnect clicked');
        // Logic ngắt kết nối
      });
    }
    
    if (armBtn) {
      armBtn.addEventListener('click', () => {
        console.log('Arm clicked');
        // Logic arm
      });
    }
    
    if (disarmBtn) {
      disarmBtn.addEventListener('click', () => {
        console.log('Disarm clicked');
        // Logic disarm
      });
    }
  }

  initSetupView() {
    // Khởi tạo logic cho Setup view
    console.log('ViewManager: Initializing Setup view...');
    
    // The setup view is now handled by the setup overlay
    // The setup menu items will trigger the overlay to open
    // This is handled in setup.js
    
    // Update setup menu status dots based on vehicle state
    this.updateSetupStatus();
  }

  updateSetupStatus() {
    // This method can be called to update the status dots
    // based on the current vehicle configuration
    console.log('ViewManager: Updating setup status...');
    
    // Example: Update status based on vehicle state
    // This would typically be called when vehicle data changes
    const statusMap = {
      summary: 'ok',
      firmware: 'ok',
      airframe: 'ok',
      radio: 'warn', // Radio needs calibration
      sensors: 'ok',
      flightmodes: 'ok',
      power: 'ok',
      motors: 'ok',
      safety: 'ok',
      tuning: 'ok',
      camera: 'ok',
      params: 'ok'
    };

    // Update dots based on status
    Object.entries(statusMap).forEach(([type, status]) => {
      const menuItem = document.querySelector(`[data-setup="${type}"]`);
      if (menuItem) {
        const dot = menuItem.querySelector('.dot');
        if (dot) {
          dot.className = `dot ${status}`;
        }
      }
    });
  }

  initSettingsView() {
    // Khởi tạo logic cho Settings view
    console.log('ViewManager: Initializing Settings view...');
    
    // Bind settings menu events
    const settingsMenu = document.querySelector('#view-settings .menu-list');
    if (settingsMenu) {
      settingsMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (menuItem) {
          const settingType = menuItem.dataset.seting;
          console.log(`Setting ${settingType} clicked`);
          // Logic xử lý settings
        }
      });
    }
  }

  // Method để refresh view hiện tại
  async refreshCurrentView() {
    if (this.currentView) {
      await this.showView(this.currentView);
    }
  }

  // Method để get view hiện tại
  getCurrentView() {
    return this.currentView;
  }
}

// Export để sử dụng trong main.js
export function initViewManager() {
  const viewManager = new ViewManager();
  return viewManager.init().then(() => viewManager);
} 
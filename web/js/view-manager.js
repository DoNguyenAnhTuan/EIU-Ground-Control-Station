// web/js/view-manager.js

class ViewManager {
  constructor() {
    this.views = {};
    this.viewContainer = document.getElementById('view-container');
    this.currentView = null;
    this.map = null;
    this.bridge = null;
    if (!this.viewContainer) {
      console.error("View container #view-container not found!");
    }
  }

  registerView(name, htmlPath, initLogicCallback = null) {
    this.views[name] = { htmlPath, initLogicCallback, element: null, loaded: false, logicInitialized: false };
    console.log(`View registered: ${name}`);
  }

  async loadView(name) {
    const view = this.views[name];
    if (!view || view.loaded) return;

    try {
      const response = await fetch(view.htmlPath);
      if (!response.ok) {
        throw new Error(`Failed to load view ${name}: ${response.statusText}`);
      }
      const html = await response.text();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const viewElement = tempDiv.firstElementChild;
      if (viewElement) {
        this.viewContainer.appendChild(viewElement);
        view.element = viewElement;
        view.loaded = true;
        console.log(`View loaded: ${name}`);
      } else {
        console.error(`No view element found in ${view.htmlPath}`);
      }
    } catch (error) {
      console.error(`Error loading view ${name}:`, error);
    }
  }

  async loadAllViews() {
    const loadPromises = Object.keys(this.views).map(name => this.loadView(name));
    await Promise.all(loadPromises);
    console.log("All views attempted to load.");
  }

  showView(name) {
    if (this.currentView === name) {
      // If already active, toggle it off
      this.hideView(name);
      this.currentView = null;
      this.updateNavigation(null);
      return;
    }

    this.hideAllViews();
    const view = this.views[name];
    if (view && view.element) {
      view.element.classList.add('active');
      this.currentView = name;
      this.updateNavigation(name);
      console.log(`View shown: ${name}`);
      
      // Execute view-specific logic if available
      if (view.initLogicCallback && !view.logicInitialized) {
        view.initLogicCallback(view.element, this.map, this.bridge);
        view.logicInitialized = true;
      }
    } else {
      console.warn(`View ${name} not found or not loaded.`);
    }
  }

  hideView(name) {
    const view = this.views[name];
    if (view && view.element) {
      view.element.classList.remove('active');
      console.log(`View hidden: ${name}`);
    }
  }

  hideAllViews() {
    Object.values(this.views).forEach(view => {
      if (view.element) {
        view.element.classList.remove('active');
      }
    });
    this.currentView = null;
    this.updateNavigation(null);
    console.log("All views hidden.");
  }

  toggleView(name) {
    if (this.currentView === name) {
      this.hideView(name);
      this.currentView = null;
      this.updateNavigation(null);
    } else {
      this.showView(name);
    }
  }

  bindNavigation() {
    document.querySelectorAll('.nav-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = button.dataset.view;
        if (viewName) {
          console.log(`Navigation button clicked: ${viewName}`);
          this.toggleView(viewName);
        }
      });
    });
    console.log('Navigation buttons bound successfully');
  }

  updateNavigation(activeView) {
    document.querySelectorAll('.nav-btn').forEach(button => {
      if (button.dataset.view === activeView) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    console.log(`Navigation updated. Active view: ${activeView}`);
  }

  getCurrentView() {
    return this.currentView;
  }
}

let viewManagerInstance = null;

export async function initViewManager(map, bridge) {
  console.log("Initializing ViewManager...");
  viewManagerInstance = new ViewManager();
  viewManagerInstance.map = map;
  viewManagerInstance.bridge = bridge;

  // Register views
  viewManagerInstance.registerView('plan', './views/plan.html', (viewElement, map, bridge) => {
    console.log("Initializing Plan view logic...");
    
    // Wire Plan view specific buttons
    const drawPolylineBtn = viewElement.querySelector('#drawPolylineBtn');
    const drawPolygonBtn = viewElement.querySelector('#drawPolygonBtn');
    const clearMarkersBtn = viewElement.querySelector('#clearMarkersBtn');
    const addStepBtn = viewElement.querySelector('#addStepBtn');
    const sendMissionBtn = viewElement.querySelector('#sendMissionBtn');
    const downloadMissionBtn = viewElement.querySelector('#downloadMissionBtn');
    
    if (drawPolylineBtn) {
      drawPolylineBtn.addEventListener('click', () => {
        console.log('Polyline button clicked');
        // Add polyline drawing logic here
        if (bridge && bridge.startPolylineDrawing) {
          bridge.startPolylineDrawing();
        }
      });
    }
    
    if (drawPolygonBtn) {
      drawPolygonBtn.addEventListener('click', () => {
        console.log('Polygon button clicked');
        // Add polygon drawing logic here
        if (bridge && bridge.startPolygonDrawing) {
          bridge.startPolygonDrawing();
        }
      });
    }
    
    if (clearMarkersBtn) {
      clearMarkersBtn.addEventListener('click', () => {
        console.log('Clear markers button clicked');
        // Add clear markers logic here
        if (bridge && bridge.clearMarkers) {
          bridge.clearMarkers();
        }
      });
    }
    
    if (addStepBtn) {
      addStepBtn.addEventListener('click', () => {
        console.log('Add step button clicked');
        // Add step logic here
        if (bridge && bridge.addStep) {
          bridge.addStep();
        }
      });
    }
    
    if (sendMissionBtn) {
      sendMissionBtn.addEventListener('click', () => {
        console.log('Send mission button clicked');
        // Add send mission logic here
        if (bridge && bridge.sendMission) {
          bridge.sendMission();
        }
      });
    }
    
    if (downloadMissionBtn) {
      downloadMissionBtn.addEventListener('click', () => {
        console.log('Download mission button clicked');
        // Add download mission logic here
        if (bridge && bridge.downloadMission) {
          bridge.downloadMission();
        }
      });
    }
    
    console.log('Plan view logic initialized');
  });
  
  viewManagerInstance.registerView('fly', './views/fly.html');
  viewManagerInstance.registerView('setup', './views/setup.html');
  viewManagerInstance.registerView('settings', './views/settings.html');

  await viewManagerInstance.loadAllViews();
  viewManagerInstance.bindNavigation();
  viewManagerInstance.showView('plan'); // Show Plan view by default

  console.log("ViewManager initialized and default view shown.");
  return viewManagerInstance;
} 
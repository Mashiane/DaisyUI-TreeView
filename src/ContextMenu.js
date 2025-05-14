const DEFAULTS = {
  iconHeight: "16px",
  iconWidth: "16px",
  itemColor: 'primary',
  itemActiveColor: '',
  itemFocusColor: '',
  itemHoverColor: '',
  menuSize: 'md',
  menuWidth: 'w-56',
  menuShadow: 'shadow-lg',
  menuBackground: 'bg-base-200',
  menuRoundedBox: true,
  menuHorizontal: false
};

/**
 * A custom HTML element that provides a dynamic, customizable context menu.
 * 
 * @class ContextMenu
 * @extends {HTMLElement}
 */
class ContextMenu extends HTMLElement {
  /**
   * Creates an instance of ContextMenu.
   * 
   * @param {Object} [options={}] - Configuration options for the context menu.
   */
  constructor(options = {}) {
    super();
    this.items = [];
    this.settings = { ...DEFAULTS, ...options };
    this.menu = document.createElement("ul");
    this.menu.classList.add(
      "hidden",
      "absolute",
      "menu",
      this.settings.menuBackground,
      this.settings.menuRoundedBox ? "rounded-box" : "",
      this.settings.menuShadow,
      this.settings.menuSize,
      this.settings.menuWidth,
      "p-2",
      "z-50"
    );
    if (this.settings.menuHorizontal) {
      this.menu.classList.add("menu-horizontal"); // Add horizontal class if specified
    }   
    document.body.appendChild(this.menu);

    this.nodeMap = new Map(); // Map to store nodes by ID
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
    this._handleContextMenu = this._handleContextMenu.bind(this);
    this._handleMenuClick = this._handleMenuClick.bind(this); // Bind the click handler
    this.triggeredElementId = null; // Store the ID of the element that triggered the context menu
  }

  /**
   * Gets the menu size.
   * @returns {string} The current menu size.
   */
  get menuSize() {
    return this.settings.menuSize;
  }

  /**
   * Sets the menu size, updates the settings, and applies the class to the menu.
   * @param {string} value - The new menu size.
   */
  set menuSize(value) {
    if (this.settings.menuSize) {
      this.menu.classList.remove(this.settings.menuSize); // Remove the old class
    }
    this.settings.menuSize = value;
    this.menu.classList.add(value); // Add the new class
  }

  /**
   * Gets the menu width.
   * @returns {string} The current menu width.
   */
  get menuWidth() {
    return this.settings.menuWidth;
  }

  /**
   * Sets the menu width, updates the settings, and applies the class to the menu.
   * @param {string} value - The new menu width.
   */
  set menuWidth(value) {
    if (this.settings.menuWidth) {
      this.menu.classList.remove(this.settings.menuWidth); // Remove the old class
    }
    this.settings.menuWidth = value;
    this.menu.classList.add(value); // Add the new class
  }

  /**
   * Gets the menu shadow.
   * @returns {string} The current menu shadow.
   */
  get menuShadow() {
    return this.settings.menuShadow;
  }

  /**
   * Sets the menu shadow, updates the settings, and applies the class to the menu.
   * @param {string} value - The new menu shadow.
   */
  set menuShadow(value) {
    if (this.settings.menuShadow) {
      this.menu.classList.remove(this.settings.menuShadow); // Remove the old class
    }
    this.settings.menuShadow = value;
    this.menu.classList.add(value); // Add the new class
  }

  /**
   * Gets the menu background.
   * @returns {string} The current menu background.
   */
  get menuBackground() {
    return this.settings.menuBackground;
  }

  /**
   * Sets the menu background, updates the settings, and applies the class to the menu.
   * @param {string} value - The new menu background.
   */
  set menuBackground(value) {
    if (this.settings.menuBackground) {
      this.menu.classList.remove(this.settings.menuBackground); // Remove the old class
    }
    this.settings.menuBackground = value;
    this.menu.classList.add(value); // Add the new class
  }

  /**
   * Gets whether the menu has rounded corners.
   * @returns {boolean} True if the menu has rounded corners, false otherwise.
   */
  get menuRoundedBox() {
    return this.settings.menuRoundedBox;
  }

  /**
   * Sets whether the menu has rounded corners and updates the settings.
   * @param {boolean} value - True to enable rounded corners, false otherwise.
   */
  set menuRoundedBox(value) {
    if (this.settings.menuRoundedBox) {
      this.menu.classList.remove("rounded-box"); // Remove the old class
    }
    this.settings.menuRoundedBox = value;
    if (value) {
      this.menu.classList.add("rounded-box"); // Add the new class
    }
  }

  /**
   * Gets whether the menu is horizontal.
   * @returns {boolean} True if the menu is horizontal, false otherwise.
   */
  get menuHorizontal() {
    return this.settings.menuHorizontal;
  }

  /**
   * Sets whether the menu is horizontal and updates the settings.
   * @param {boolean} value - True to make the menu horizontal, false otherwise.
   */
  set menuHorizontal(value) {
    if (this.settings.menuHorizontal) {
      this.menu.classList.remove("menu-horizontal"); // Remove the old class
    }
    this.settings.menuHorizontal = value;
    if (value) {
      this.menu.classList.add("menu-horizontal"); // Add the new class
    }
  }

  /**
   * Gets the icon height.
   * @returns {string} The current icon height.
   */
  get iconHeight() {
    return this.settings.iconHeight;
  }

  /**
   * Sets the icon height and updates the settings.
   * @param {string} value - The new icon height.
   */
  set iconHeight(value) {
    this.settings.iconHeight = value;
  }

  /**
   * Gets the icon width.
   * @returns {string} The current icon width.
   */
  get iconWidth() {
    return this.settings.iconWidth;
  }

  /**
   * Sets the icon width and updates the settings.
   * @param {string} value - The new icon width.
   */
  set iconWidth(value) {
    this.settings.iconWidth = value;
  }

  /**
   * Gets the item color.
   * @returns {string} The current item color.
   */
  get itemColor() {
    return this.settings.itemColor;
  }

  /**
   * Sets the item color and updates the settings.
   * @param {string} value - The new item color.
   */
  set itemColor(value) {
    this.settings.itemColor = value;
  }

  /**
   * Gets the item active color.
   * @returns {string} The current item active color.
   */
  get itemActiveColor() {
    return this.settings.itemActiveColor;
  }

  /**
   * Sets the item active color and updates the settings.
   * @param {string} value - The new item active color.
   */
  set itemActiveColor(value) {
    this.settings.itemActiveColor = value;
  }

  /**
   * Gets the item focus color.
   * @returns {string} The current item focus color.
   */
  get itemFocusColor() {
    return this.settings.itemFocusColor;
  }

  /**
   * Sets the item focus color and updates the settings.
   * @param {string} value - The new item focus color.
   */
  set itemFocusColor(value) {
    this.settings.itemFocusColor = value;
  }

  /**
   * Gets the item hover color.
   * @returns {string} The current item hover color.
   */
  get itemHoverColor() {
    return this.settings.itemHoverColor;
  }

  /**
   * Sets the item hover color and updates the settings.
   * @param {string} value - The new item hover color.
   */
  set itemHoverColor(value) {
    this.settings.itemHoverColor = value;
  }

  /**
   * Called when the element is added to the DOM.
   * Sets up event listeners and initializes the target element.
   */
  connectedCallback() {
    const targetSelector = this.getAttribute("target");
    if (!targetSelector) {
      console.error("ContextMenu: 'target' attribute is required.");
      return;
    }

    this.targetElement = document.querySelector(targetSelector);
    if (this.targetElement) {
      this.targetElement.addEventListener("contextmenu", this._handleContextMenu);
    }
    document.addEventListener("click", this._handleOutsideClick);
    this.menu.addEventListener("click", this._handleMenuClick); // Add delegated click event
  }

  /**
   * Called when the element is removed from the DOM.
   * Cleans up event listeners and removes the menu element.
   */
  disconnectedCallback() {
    if (this.targetElement) {
      this.targetElement.removeEventListener("contextmenu", this._handleContextMenu);
    }
    document.removeEventListener("click", this._handleOutsideClick);
    this.menu.removeEventListener("click", this._handleMenuClick); // Remove delegated click event
    this.menu.remove();
  }

  /**
   * Handles the contextmenu event to display the menu.
   * 
   * @param {MouseEvent} event - The contextmenu event.
   */
  _handleContextMenu(event) {
    event.preventDefault();
    this.triggeredElementId = event.target.id || null; // Store the ID of the element that triggered the menu
    this._clearMenu();
    this._populateMenu();
    this._showMenu(event.pageX, event.pageY);
  }

  /**
   * Handles clicks outside the menu to hide it.
   * 
   * @param {MouseEvent} event - The click event.
   */
  _handleOutsideClick(event) {
    if (!this.menu.contains(event.target)) {
      this._hideMenu();
    }
  }

  /**
   * Handles clicks on menu items and dispatches a custom ItemClick event.
   * 
   * @param {MouseEvent} event - The click event.
   */
  _handleMenuClick(event) {
    if (event.target.classList.contains("xlink") || event.target.classList.contains("xspan")) {
      const nodeId = event.target.dataset.nodeId; // Get the nodeId from the dataset
      if (nodeId) {
        const node = this.nodeMap.get(nodeId);
        if (node) {
          // Fire a custom ItemClick event
          const itemClickEvent = new CustomEvent("ItemClick", {
            detail: { node, elementId: this.triggeredElementId }, // Include the triggered element ID
            bubbles: true,
            cancelable: true,
          });
          this.dispatchEvent(itemClickEvent);
          this._hideMenu();
        }
      }
      return;
    }
    const details = event.target.closest("summary") || event.target.closest("details");
    if (details) {
      event.stopPropagation();
      return;
    }

    const menuItem = event.target.closest("li"); // Find the closest <li> element
    if (menuItem) {
      const nodeId = menuItem.dataset.nodeId; // Get the nodeId from the dataset
      if (nodeId) {
        const node = this.nodeMap.get(nodeId);
        if (node) {
          // Fire a custom ItemClick event
          const itemClickEvent = new CustomEvent("ItemClick", {
            detail: { node, elementId: this.triggeredElementId }, // Include the triggered element ID
            bubbles: true,
            cancelable: true,
          });
          this.dispatchEvent(itemClickEvent);
          this._hideMenu();
        }
      }
    }
  }

  /**
   * Displays the menu at the specified coordinates, adjusting for viewport boundaries.
   * 
   * @param {number} x - The x-coordinate for the menu.
   * @param {number} y - The y-coordinate for the menu.
   */
  _showMenu(x, y) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuRect = this.menu.getBoundingClientRect();

    // Adjust position to prevent overflow
    const adjustedX = x + menuRect.width > viewportWidth ? viewportWidth - menuRect.width : x;
    const adjustedY = y + menuRect.height > viewportHeight ? viewportHeight - menuRect.height : y;

    this.menu.style.left = `${adjustedX}px`;
    this.menu.style.top = `${adjustedY}px`;
    this.menu.classList.remove("hidden");
  }

  /**
   * Hides the menu.
   */
  _hideMenu() {
    this.menu.classList.add("hidden");
  }

  /**
   * Clears all items from the menu.
   */
  _clearMenu() {
    this.menu.innerHTML = "";
  }

  /**
   * Populates the menu with items from the items array.
   */
  _populateMenu() {
    const buildMenu = (items, container) => {
      items.forEach((item) => {
        const menuItem = document.createElement("li");
        menuItem.id = item.nodeId + "-li";
        menuItem.dataset.nodeId = item.nodeId; // Store the nodeId in the dataset

        if (this.settings.itemColor !== '') menuItem.classList.add(this.settings.itemColor);
        if (this.settings.itemActiveColor !== '') menuItem.classList.add(this.settings.itemActiveColor);
        if (this.settings.itemFocusColor !== '') menuItem.classList.add(this.settings.itemFocusColor);
        if (this.settings.itemHoverColor !== '') menuItem.classList.add(this.settings.itemHoverColor); 

        if (item.children && item.children.length > 0) {
          const details = document.createElement("details");
          details.classList.add("details");
          details.setAttribute("open", true);
          details.id = item.nodeId + "-details";
          details.dataset.nodeId = item.nodeId;

          const summary = document.createElement("summary");
          summary.id = item.nodeId + "-summary";
          summary.classList.add("summary");
          summary.dataset.nodeId = item.nodeId;

          if (item.icon && item.icon.trim() !== "") {
            const icon = document.createElement("svg-renderer");
            icon.id = item.nodeId + "-icon"; // Unique ID for the icon
            icon.classList.add("icon");
            icon.dataset.src = item.icon;
            icon.dataset.nodeId = item.nodeId;
            icon.setAttribute("replace", true);
            icon.setAttribute("use-localstorage", true);
            icon.setAttribute("style", "pointer-events:none; min-height:" + this.settings.iconHeight + "; min-width:" + this.settings.iconWidth + ";"); // Updated
            icon.setAttribute("fill", "currentColor"); // Updated
            icon.setAttribute("data-js", "enabled"); // Updated
            icon.setAttribute("width", this.settings.iconWidth);
            icon.setAttribute("height", this.settings.iconHeight);
            summary.appendChild(icon);
          }

          const text = document.createElement("span");
          text.id = item.nodeId + "-text"; // Unique ID for the text
          text.classList.add("text");
          text.dataset.nodeId = item.nodeId;
          text.textContent = item.label;
          summary.appendChild(text);
          details.appendChild(summary);
         
          const subMenu = document.createElement("ul");
          buildMenu(item.children, subMenu);
          details.appendChild(subMenu);
          menuItem.appendChild(details);
        } else {
          const link = document.createElement("div");
          link.classList.add("flex", "items-center", "gap-2", "xlink");
          link.id = item.nodeId + "-link"; // Unique ID for the link
          link.dataset.nodeId = item.nodeId;

          if (item.icon && item.icon.trim() !== "") {
            const icon = document.createElement("svg-renderer");
            icon.id = item.nodeId + "-icon"; // Unique ID for the icon
            icon.classList.add("icon"); 
            icon.dataset.src = item.icon;
            icon.dataset.nodeId = item.nodeId;
            icon.setAttribute("replace", true);
            icon.setAttribute("use-localstorage", true);
            icon.setAttribute("style", "pointer-events:none; min-height:" + this.settings.iconHeight + "; min-width:" + this.settings.iconWidth + ";"); // Updated
            icon.setAttribute("fill", "currentColor"); // Updated
            icon.setAttribute("data-js", "enabled"); // Updated
            icon.setAttribute("width", this.settings.iconWidth);
            icon.setAttribute("height", this.settings.iconHeight);
            link.appendChild(icon);
          }

          const text = document.createElement("span");
          text.textContent = item.label;
          text.id = item.nodeId + "-text"; // Unique ID for the text
          text.classList.add("xspan"); 
          text.dataset.nodeId = item.nodeId;
          link.appendChild(text);
          menuItem.appendChild(link);
        }

        container.appendChild(menuItem);
      });
    };

    buildMenu(this.items, this.menu);
  }

  /**
   * Adds a new item to the menu.
   * 
   * @param {string} parentId - The ID of the parent node.
   * @param {string} nodeId - The ID of the new node.
   * @param {string} [iconUrl=""] - The URL of the icon for the node.
   * @param {string} label - The label for the node.
   */
  addItem(parentId, nodeId, iconUrl = "", label) {
    parentId = parentId?.trim().toLowerCase() || "";
    nodeId = nodeId?.trim().toLowerCase() || "";
    iconUrl = iconUrl || "";
    label = label || "";

    if (!nodeId) return;
    if (this.nodeMap.has(nodeId)) return;

    const newNode = { nodeId, parentId, icon: iconUrl, label, children: [] };

    if (!parentId) {
      this.items.push(newNode);
    } else {
      const parentNode = this.nodeMap.get(parentId);
      if (parentNode) {
        parentNode.children.push(newNode);
      } else {
        console.error(`Parent menu item with ID '${parentId}' not found.`);
        return;
      }
    }

    this.nodeMap.set(nodeId, newNode);
  }

  /**
   * Clears the nodeMap variable.
   */
  clear() {
    this.nodeMap.clear();
  }

  /**
   * Refreshes the menu by clearing and repopulating it.
   */
  refresh() {
    this._clearMenu();
    this._populateMenu();
  }
}

customElements.define("context-menu", ContextMenu);
export default ContextMenu;
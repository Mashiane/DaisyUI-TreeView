const DEFAULTS = {
  data: [],
  expandIconUrl: "./assets/chevron-down-solid.svg",
  collapseIconUrl: "./assets/chevron-right-solid.svg",
  blankIconUrl: "./assets/blank.svg",
  hasCheckbox: false,
  treeName: "treeView", // Changed to camelCase
  multipleSelect: false,
  multipleCheck: false,
  iconHeight: "16px",
  iconWidth: "16px",
  inlineEdit: false,
  dragNDrop: false,
  itemColor: 'primary',
  itemActiveColor: '',
  itemFocusColor: '',
  itemHoverColor: '',
  UseLocalstorage: true,
  replace: false,
  checkBoxSize: "md",
  textBoxSize: "sm",
  checkBoxActiveColor: "",
  checkBoxActiveBorderColor: "",
};

/**
 * DaisyUITreeView is a customizable tree view component that supports features like
 * drag-and-drop, inline editing, multi-selection, and dynamic node management.
 * It allows developers to create interactive and accessible tree structures.
 */
class DaisyUITreeView {
  /**
   * Creates an instance of DaisyUITreeView.
   * @param {HTMLElement} container - The container element where the tree view will be rendered.
   * @param {Object} [options={}] - Configuration options for the tree view.
   * @param {Array} [options.data=[]] - Initial data for the tree structure.
   * @param {string} [options.expandIconUrl] - URL for the expand icon.
   * @param {string} [options.collapseIconUrl] - URL for the collapse icon.
   * @param {boolean} [options.hasCheckbox=false] - Whether nodes should have checkboxes.
   * @param {string} [options.treeName="treeView"] - Unique name for the tree view.
   * @param {boolean} [options.multipleSelect=false] - Whether multiple nodes can be selected.
   * @param {boolean} [options.multipleCheck=false] - Whether multiple nodes can be checked.
   * @param {string} [options.iconHeight="16px"] - Height of the icons.
   * @param {string} [options.iconWidth="16px"] - Width of the icons.
   * @param {boolean} [options.inlineEdit=false] - Whether inline editing is enabled.
   * @param {boolean} [options.dragNDrop=false] - Whether drag-and-drop is enabled.
   * @param {string} [options.itemColor=""] - CSS class for item color.
   * @param {string} [options.itemActiveColor=""] - CSS class for active item color.
   * @param {string} [options.itemFocusColor=""] - CSS class for focused item color.
   * @param {string} [options.itemHoverColor=""] - CSS class for hover item color.
   */
  constructor(container, options = {}) {
    this.element = container;
    this.settings = { ...DEFAULTS, ...options };
    this.treeName = this._normalizeId(this.settings.treeName);
    this.tree = [];
    this.nodeMap = new Map();
    this._checkedNodes = new Set();
    this._selectedNodes = new Set();
    this._visibleNodes = new Set();
    this._activeColor = this.fixColor('checked:bg', this.settings.checkBoxActiveColor);
    this._activeBorderColor = this.fixColor('checked:border', this.settings.checkBoxActiveBorderColor);
    this._inputColorClass = `input-${this.settings.itemColor}`;
    this._checkColorClass = `checkbox-${this.settings.itemColor}`;
    this._inputSizeClass = `input-${this.settings.textBoxSize}`;
    this._checkSizeClass = `checkbox-${this.settings.checkBoxSize}`;
    if (this.settings.data) {
      let data = Array.isArray(this.settings.data)
        ? JSON.parse(JSON.stringify(this.settings.data))
        : [];
      this.tree = data;
      delete this.settings.data;
    }
    this._refresh();
    if (this.settings.dragNDrop) this._enableDragAndDrop();
    this.element.addEventListener("blur", this._onBlur.bind(this), true);
    this.element.addEventListener("keydown", this._onKeydown.bind(this));
    this.element.addEventListener("click", (e) => this._onClick(e));
    const style = document.createElement('style');
    style.innerHTML = `.xsummary::after { display: none !important; }`;
    document.head.appendChild(style);
  }

  _toggleVisibility(element, show) {
    if (!element) return;
    if (show) {
      element.classList.remove("hidden");
    } else {
      element.classList.add("hidden");
    }
  }

  _getElementById(id) {
    return document.getElementById(id);
  }
  _onCheckboxChange(nodeId, checked) {
    if (!this.nodeExists(nodeId)) return;
    const node = this.findNode(nodeId);

    // Update the checked state of the node
    this.checkNode(nodeId, checked);

    // Dispatch a custom event to notify about the checkbox change
    this._dispatchEvent("nodeChecked", { node, checked });
  }

fixColor(prefix, suffix) {
    // Treat null or undefined as blank
    prefix = prefix == null ? '' : String(prefix);
    suffix = suffix == null ? '' : String(suffix);

    if (!prefix || !suffix) {
        return '';
    }

    if (suffix.startsWith('#')) {
        suffix = `[${suffix}]`;
    }

    if (prefix === 'btn' || prefix === 'badge') {
        prefix = 'bg';
    }

    const result = `${prefix}-${suffix}`;
    if (result.endsWith('-')) {
        return '';
    }
    return result;
  }

   /**
   * Collapses all nodes in the tree view.
   */
  collapseAll() {
    const collapseRecursive = (nodes) => {
      for (const node of nodes) {
        this._collapseNode(node.nodeId);
        if (node.nodes) collapseRecursive(node.nodes);
      }
    };
    collapseRecursive(this.tree);
  }

    /**
   * Expands all nodes in the tree view.
   */
  expandAll() {
    const expandRecursive = (nodes) => {
      for (const node of nodes) {
        this._expandNode(node.nodeId);
        if (node.nodes) expandRecursive(node.nodes); // Recursively expand child nodes
      }
    };
    expandRecursive(this.tree);
  }

  _refresh() {
    const fragment = document.createDocumentFragment();
    this._initializeData({ nodes: this.tree });
    this._build(fragment, this.tree);
    this.element.innerHTML = ""; // Clear only once
    this.element.appendChild(fragment);
  }

  _initializeData(context) {
    if (!context.nodes) return;
    for (const node of context.nodes) {
      node.nodeId = this._normalizeId(node.nodeId);
      node.parentId = this._normalizeId(node.parentId);
      this._visibleNodes.add(node.nodeId);
      this.nodeMap.set(node.nodeId, node);
      if (node.nodes) this._initializeData({ nodes: node.nodes });
    }
  }

  _build(container, nodeList) {
    for (const node of nodeList) {
      const item = document.createElement("li");
      item.id = `${this.treeName}-${node.nodeId}`;
      item.classList.add("list-item");
      item.dataset.id = node.nodeId;
      item.setAttribute("role", "treeitem");
      item.setAttribute("aria-expanded", node.expanded || false);
      if (this.settings.dragNDrop) item.setAttribute("draggable", "true");
      item.setAttribute(
        "aria-selected",
        this._selectedNodes.has(node.nodeId) || false
      );
      if (this.settings.itemColor !== '') item.classList.add(this.settings.itemColor);
      if (this.settings.itemActiveColor !== '') item.classList.add(this.settings.itemActiveColor);
      if (this.settings.itemFocusColor !== '') item.classList.add(this.settings.itemFocusColor);
      if (this.settings.itemHoverColor !== '') item.classList.add(this.settings.itemHoverColor); 
      if (!this._visibleNodes.has(node.nodeId)) {
        this._toggleVisibility(item, false);
      }
      if (this._selectedNodes.has(node.nodeId)) {
        item.classList.add("menu-active");
      }
      if (node.disabled) {
        item.setAttribute("aria-disabled", "true");
        item.classList.add("menu-disabled");
      }

           
      if (node.nodes && node.nodes.length > 0) {
        const details = document.createElement("details");
        details.id = `${this.treeName}-${node.nodeId}-details`;
        details.dataset.id = node.nodeId;
        details.classList.add("xdetails");
        item.classList.add("xdetails");
        if (node.expanded) details.setAttribute("open", "");

        const summary = document.createElement("summary");
        summary.id = `${this.treeName}-${node.nodeId}-summary`;
        summary.dataset.id = node.nodeId;
        summary.classList.add("xsummary");      
        
        const hostdiv = document.createElement("div");
        hostdiv.id = `${this.treeName}-${node.nodeId}-div`;
        hostdiv.dataset.id = node.nodeId;
        hostdiv.classList.add("flex", "items-center", "gap-3", "w-full", "xdiv"); 
        //expand collapse icon
        const expandicon = document.createElement("svg-renderer");        
        expandicon.setAttribute("replace", false);
        expandicon.id = `${this.treeName}-${node.nodeId}-expandicon`;
        expandicon.dataset.id = node.nodeId;
        expandicon.setAttribute("use-localstorage", this.settings.UseLocalstorage);
        expandicon.dataset.src = node.expanded
            ? this.settings.expandIconUrl
            : this.settings.collapseIconUrl;
        expandicon.setAttribute("style", "pointer-events:none; min-height:" + this.settings.iconHeight + "; min-width:" + this.settings.iconWidth + ";"); // Updated
        expandicon.setAttribute("fill", "currentColor"); // Updated
        expandicon.setAttribute("data-js", "enabled"); // Updated
        expandicon.setAttribute("width", this.settings.iconWidth);
        expandicon.setAttribute("height", this.settings.iconHeight);
        hostdiv.appendChild(expandicon);

        if (node.iconUrl) {
          const icon = document.createElement("svg-renderer");
          icon.setAttribute("replace", true);
          icon.id = `${this.treeName}-${node.nodeId}-icon`;
          icon.setAttribute("use-localstorage", this.settings.UseLocalstorage);
          icon.dataset.src = node.iconUrl
          icon.dataset.id = node.nodeId;
          icon.setAttribute("style", "pointer-events:none; min-height:" + this.settings.iconHeight + "; min-width:" + this.settings.iconWidth + ";"); // Updated
          icon.setAttribute("fill", "currentColor"); // Updated
          icon.setAttribute("data-js", "enabled"); // Updated
          icon.setAttribute("width", this.settings.iconWidth);
          icon.setAttribute("height", this.settings.iconHeight);
          hostdiv.appendChild(icon);
        }

        if (this.settings.hasCheckbox) {
          const checkbox = document.createElement("input");
          checkbox.id = `${this.treeName}-${node.nodeId}-check`;
          checkbox.type = "checkbox";
          checkbox.classList.add("checkbox");
          if (this._checkColorClass !== '') checkbox.classList.add(this._checkColorClass);
          if (this._activeColor !== '') checkbox.classList.add(this._activeColor);
          if (this._activeBorderColor !== '') checkbox.classList.add(this._activeBorderColor);
          if (this._checkSizeClass !== '') checkbox.classList.add(this._checkSizeClass);
          checkbox.dataset.id = node.nodeId;
          checkbox.checked = this._checkedNodes.has(node.nodeId);
          hostdiv.appendChild(checkbox);
        }

        const txtBox = document.createElement("input");
        txtBox.id = `${this.treeName}-${node.nodeId}-input`;
        txtBox.type = "text";
        txtBox.value = node.text;
        txtBox.classList.add(
          "input",
          "input-ghost",
          "hidden",
          "xinput", 
          "w-full"
        );
        if (this._inputColorClass !== '') txtBox.classList.add(this._inputColorClass);   
        if (this._inputSizeClass !== '') txtBox.classList.add(this._inputSizeClass);       
        txtBox.dataset.id = node.nodeId;
        hostdiv.appendChild(txtBox);

        const textNode = document.createElement("span");
        textNode.id = `${this.treeName}-${node.nodeId}-text`;
        textNode.textContent = node.text;
        textNode.dataset.id = node.nodeId;
        textNode.classList.add("xspan");

        hostdiv.appendChild(textNode);
        summary.appendChild(hostdiv);
        details.appendChild(summary);

        const nestedList = document.createElement("ul");
        nestedList.id = `${this.treeName}-${node.nodeId}-ul`;
        nestedList.dataset.id = node.nodeId;

        this._build(nestedList, node.nodes);
        details.appendChild(nestedList);
        item.appendChild(details);
      } else {
        // div class="flex items-center gap-3 w-full"
        const link = document.createElement("div");
        link.id = `${this.treeName}-${node.nodeId}-anchor`;
        link.dataset.id = node.nodeId;
        link.classList.add("xanchor", "flex", "items-center", "gap-3", "w-full");
        if (this.settings.itemColor !== '') link.classList.add(this.settings.itemColor);
        if (this.settings.itemActiveColor !== '') link.classList.add(this.settings.itemActiveColor);
        if (this.settings.itemFocusColor !== '') link.classList.add(this.settings.itemFocusColor);
        if (this.settings.itemHoverColor !== '') link.classList.add(this.settings.itemHoverColor); 

        if (node.href) {
          link.setAttribute("href", node.href);
        }

         //expand collapse icon
        const expandicon = document.createElement("svg-renderer");        
        expandicon.setAttribute("replace", this.settings.replace);
        expandicon.id = `${this.treeName}-${node.nodeId}-blankicon`;
        expandicon.dataset.id = node.nodeId;
        expandicon.setAttribute("use-localstorage", this.settings.UseLocalstorage);
        expandicon.dataset.src = this.settings.blankIconUrl;        
        expandicon.setAttribute("style", "pointer-events:none; min-height:" + this.settings.iconHeight + "; min-width:" + this.settings.iconWidth + ";"); // Updated
        expandicon.setAttribute("fill", "currentColor"); // Updated
        expandicon.setAttribute("data-js", "enabled"); // Updated
        expandicon.setAttribute("width", this.settings.iconWidth);
        expandicon.setAttribute("height", this.settings.iconHeight);
        link.appendChild(expandicon);

        if (node.iconUrl) {
          const icon = document.createElement("svg-renderer");
          icon.setAttribute("replace", true);
          icon.setAttribute("use-localstorage", this.settings.UseLocalstorage);
          icon.dataset.src = node.iconUrl;
          icon.dataset.id = node.nodeId;
          icon.id = `${this.treeName}-${node.nodeId}-icon`;
          icon.setAttribute("style", "pointer-events:none; min-height:" + this.settings.iconHeight + "; min-width:" + this.settings.iconWidth + ";"); // Updated
          icon.setAttribute("fill", "currentColor"); // Updated
          icon.setAttribute("data-js", "enabled"); // Updated
          icon.setAttribute("width", this.settings.iconWidth);
          icon.setAttribute("height", this.settings.iconHeight);
          link.appendChild(icon);
        }

        if (this.settings.hasCheckbox) {
          const checkbox = document.createElement("input");
          checkbox.id = `${this.treeName}-${node.nodeId}-check`;
          checkbox.type = "checkbox";
          checkbox.classList.add("checkbox");
          checkbox.dataset.id = node.nodeId;
          checkbox.checked = this._checkedNodes.has(node.nodeId);
          if (this._checkColorClass !== '') checkbox.classList.add(this._checkColorClass);
          if (this._activeColor !== '') checkbox.classList.add(this._activeColor);
          if (this._activeBorderColor !== '') checkbox.classList.add(this._activeBorderColor);
          if (this._checkSizeClass !== '') checkbox.classList.add(this._checkSizeClass);
          link.appendChild(checkbox);
        }

        const txtBox = document.createElement("input");
        txtBox.id = `${this.treeName}-${node.nodeId}-input`;
        txtBox.type = "text";
        txtBox.value = node.text;
        txtBox.classList.add(
          "input",
          "input-ghost",
          "hidden",
          "w-full",
          "xinput"
        );
        if (this._inputColorClass !== '') txtBox.classList.add(this._inputColorClass);   
        if (this._inputSizeClass !== '') txtBox.classList.add(this._inputSizeClass);
        txtBox.dataset.id = node.nodeId;
        link.appendChild(txtBox);

        const textNode = document.createElement("span");
        textNode.id = `${this.treeName}-${node.nodeId}-text`;
        textNode.textContent = node.text;
        textNode.dataset.id = node.nodeId;
        textNode.classList.add("xspan");
        link.appendChild(textNode);
        item.appendChild(link);
      }

      container.appendChild(item);
    }
  }

  _onClick(e) {
    // if we checked a checkbox, then exit
    const checkbox = e.target.closest(".checkbox");
    if (checkbox) {
      e.stopPropagation(); // Prevent further propagation
      const nodeId = this._normalizeId(checkbox.dataset.id);
      if (this.nodeExists(nodeId)) {
        const checked = checkbox.checked;
        this._onCheckboxChange(nodeId, checked); // Handle checkbox logic
      }
      return; // Exit to prevent firing other events
    }
    const xsummary = e.target.closest(".xsummary");
    if (xsummary) {
      e.stopPropagation(); // Prevent further propagation
      const id = this._normalizeId(xsummary.dataset.id);
      if (!this.nodeExists(id)) return;
      const node = this.findNode(id);
      const details = this._getElementById(`${this.treeName}-${id}-details`);
      let show = details.hasAttribute("open");
      show = !show;
      node.expanded = show;
      const evt = show ? "nodeExpanded" : "nodeCollapsed";
      const icon = this._getElementById(`${this.treeName}-${id}-expandicon`);
      if (icon) {
        if (show) {
          icon.setAttribute("data-src", this.settings.expandIconUrl);
        } else {
          icon.setAttribute("data-src", this.settings.collapseIconUrl);
        }
        //node.iconUrl = icon.getAttribute("data-src");
      }
      this._dispatchEvent(evt, { node });
      return;
    }

    const xspan = e.target.closest(".xspan");
    if (xspan) {
      e.stopPropagation(); // Prevent further propagation
      const id = this._normalizeId(xspan.dataset.id);
      if (!this.nodeExists(id)) return;
      const node = this.findNode(id);
      if (
        this.settings.inlineEdit &&
        e.target.id === `${this.treeName}-${id}-text`
      ) {
        this._enableInlineEdit(id); // Activate inline editing
        return; // Exit to prevent firing nodeClick
      }
      // Fire nodeClick event
      this._dispatchEvent("nodeClick", { node });
      return;
    }

    const xanchor = e.target.closest(".xanchor");
    if (xanchor) {
      e.stopPropagation(); // Prevent further propagation
      const id = this._normalizeId(xanchor.dataset.id);
      if (!this.nodeExists(id)) return;
      const node = this.findNode(id);
      if (this.settings.inlineEdit) {
        this._enableInlineEdit(id); // Activate inline editing
        return; // Exit to prevent firing nodeClick
      }
      // Fire nodeClick event
      this._dispatchEvent("nodeClick", { node });
      return;
    }
  }

  _enableDragAndDrop() {
    this.element.addEventListener("dragend", (e) => {
      const item = this.element.querySelector(".drag-over");
      if (item) item.classList.remove("drag-over");
    });

    this.element.addEventListener("dragstart", (e) => {
      const item = e.target.closest(".list-item");
      if (item) e.dataTransfer.setData("id", item.dataset.id);
    });

    this.element.addEventListener("dragover", (e) => {
      e.preventDefault();
      const item = e.target.closest(".list-item");
      if (item) item.classList.add("drag-over");
    });

    this.element.addEventListener("dragleave", (e) => {
      const item = e.target.closest(".list-item");
      if (item) item.classList.remove("drag-over");
    });

    this.element.addEventListener("drop", (e) => {
      e.preventDefault();
      const targetItem = e.target.closest(".list-item");
      if (!targetItem) return;

      const draggedNodeId = e.dataTransfer.getData("id");
      const targetNodeId = targetItem.dataset.id;

      if (draggedNodeId === targetNodeId) return; // Prevent dropping onto itself

      const draggedNode = this.findNode(draggedNodeId);
      const targetNode = this.findNode(targetNodeId);

      let parent = targetNode;
      while (parent) {
        if (parent.nodeId === draggedNodeId) return; // Prevent dropping onto descendants
        parent = this.findNode(parent.parentId);
      }

      if (draggedNode && targetNode) {
        // Enhancement: Dispatch custom events for drag-and-drop actions
        this._dispatchEvent("nodeDragStart", { draggedNode });
        this._dispatchEvent("nodeDrop", { draggedNode, targetNode });

        this.removeNode(draggedNodeId);
        this.addNode(
          targetNodeId,
          draggedNode.nodeId,
          draggedNode.iconUrl,
          draggedNode.text,
          draggedNode.href,
          draggedNode.hasCheckbox
        );
        this._refresh();
      }
    });
  }

  _normalizeId(id) {
    return (id ?? "").toString().trim().toLowerCase();
  }

  _cstr(id) {
    return (id ?? "").toString();
  }

  nodeExists(nodeId) {
    const normalizedId = this._normalizeId(nodeId);
    if (normalizedId === "") return false;
    return this.nodeMap.has(normalizedId);
  }

  findNode(nodeId) {
    const normalizedId = this._normalizeId(nodeId);
    if (normalizedId === "") return null; // Return null if the normalized ID is empty
    return this.nodeMap.get(normalizedId) || null; // Return the node or null if not found
  }

    /**
   * Adds a new node to the tree.
   * @param {string} parentId - The ID of the parent node.
   * @param {string} nodeId - The ID of the new node.
   * @param {string} [iconUrl=""] - URL for the node's icon.
   * @param {string} text - The text content of the node.
   * @param {string} [href=""] - The hyperlink for the node.
   */
  addNode(parentId, nodeId, iconUrl = "", text, href = "") {
    parentId = this._normalizeId(parentId);
    nodeId = this._normalizeId(nodeId);
    iconUrl = this._cstr(iconUrl);
    text = this._cstr(text);
    href = this._cstr(href);
    //
    if (nodeId === "") return;
    if (this.nodeExists(nodeId)) return;
    if (iconUrl === "") iconUrl = this.settings.blankIconUrl;
    
    const hasCheckbox = this.settings.hasCheckbox || false;
    const newNode = { nodeId, parentId, iconUrl, text, href, hasCheckbox };

    if (parentId === "") {
      this.tree.push(newNode);
    } else {
      const parent = this.findNode(parentId);
      if (parent) {
        parent.nodes = parent.nodes || [];
        parent.nodes.push(newNode);
        this.nodeMap.set(parentId, parent);
      }
    }

    this.nodeMap.set(nodeId, newNode); // Add to node map
    this._visibleNodes.add(nodeId);
  }

/**
 * Adds a new node before a specified node ID.
 * @param {string} targetNodeId - The ID of the target node before which the new node will be added.
 * @param {string} nodeId - The ID of the new node.
 * @param {string} [iconUrl=""] - URL for the node's icon.
 * @param {string} text - The text content of the node.
 * @param {string} [href=""] - The hyperlink for the node.
 */
addNodeBefore(targetNodeId, nodeId, iconUrl = "", text, href = "") {
  targetNodeId = this._normalizeId(targetNodeId);
  nodeId = this._normalizeId(nodeId);
  iconUrl = this._cstr(iconUrl);
  text = this._cstr(text);
  href = this._cstr(href);

  if (!this.nodeExists(targetNodeId) || this.nodeExists(nodeId)) return;
  if (iconUrl === "") iconUrl = this.settings.blankIconUrl;

  const targetNode = this.findNode(targetNodeId);
  const parentId = targetNode.parentId;
  const newNode = { nodeId, parentId, iconUrl, text, href, hasCheckbox: this.settings.hasCheckbox || false };

  if (!parentId) {
    const index = this.tree.findIndex(node => node.nodeId === targetNodeId);
    if (index !== -1) this.tree.splice(index, 0, newNode);
  } else {
    const parent = this.findNode(parentId);
    if (parent && parent.nodes) {
      const index = parent.nodes.findIndex(node => node.nodeId === targetNodeId);
      if (index !== -1) parent.nodes.splice(index, 0, newNode);
    }
  }

  this.nodeMap.set(nodeId, newNode);
  this._visibleNodes.add(nodeId);
  this._refresh();
}

/**
 * Adds a new node after a specified node ID.
 * @param {string} targetNodeId - The ID of the target node after which the new node will be added.
 * @param {string} nodeId - The ID of the new node.
 * @param {string} [iconUrl=""] - URL for the node's icon.
 * @param {string} text - The text content of the node.
 * @param {string} [href=""] - The hyperlink for the node.
 */
addNodeAfter(targetNodeId, nodeId, iconUrl = "", text, href = "") {
  targetNodeId = this._normalizeId(targetNodeId);
  nodeId = this._normalizeId(nodeId);
  iconUrl = this._cstr(iconUrl);
  text = this._cstr(text);
  href = this._cstr(href);

  if (!this.nodeExists(targetNodeId) || this.nodeExists(nodeId)) return;
  if (iconUrl === "") iconUrl = this.settings.blankIconUrl;

  const targetNode = this.findNode(targetNodeId);
  const parentId = targetNode.parentId;
  const newNode = { nodeId, parentId, iconUrl, text, href, hasCheckbox: this.settings.hasCheckbox || false };

  if (!parentId) {
    const index = this.tree.findIndex(node => node.nodeId === targetNodeId);
    if (index !== -1) this.tree.splice(index + 1, 0, newNode);
  } else {
    const parent = this.findNode(parentId);
    if (parent && parent.nodes) {
      const index = parent.nodes.findIndex(node => node.nodeId === targetNodeId);
      if (index !== -1) parent.nodes.splice(index + 1, 0, newNode);
    }
  }

  this.nodeMap.set(nodeId, newNode);
  this._visibleNodes.add(nodeId);
  this._refresh();
}

  findNodeRecursive(tree, nodeId) {
    for (const node of tree) {
      if (node.nodeId === nodeId) {
        return node; // Node found
      }
      if (node.nodes && node.nodes.length > 0) {
        const result = findNodeRecursive(node.nodes, nodeId); // Recursively search in child nodes
        if (result) {
          return result; // Return the node if found in children
        }
      }
    }
    return null; // Node not found
  }

    /**
   * Hides a node and its children from the tree view.
   * @param {string} nodeId - The ID of the node to hide.
   */
  hideNode(nodeId) {
    if (!this.nodeExists(nodeId)) return;
    const node = this.findNode(nodeId);
    const hideChildren = (node) => {
      if (!node) return;
      this._visibleNodes.delete(node.nodeId);
      node.visible = false;
      const item = this._getElementById(`${this.treeName}-${node.nodeId}`);
      if (item) this._toggleVisibility(item, false);
      if (node.nodes) {
        node.nodes.forEach((child) => hideChildren(child));
      }
    };

    hideChildren(node);
  }

    /**
   * Shows a previously hidden node and its children.
   * @param {string} nodeId - The ID of the node to show.
   */
  showNode(nodeId) {
    if (!this.nodeExists(nodeId)) return;
    const node = this.findNode(nodeId);
    const showChildren = (node) => {
      if (!node) return;
      this._visibleNodes.add(node.nodeId);
      node.visible = true;
      const item = this._getElementById(`${this.treeName}-${node.nodeId}`);
      if (item) this._toggleVisibility(item, true);
      if (node.nodes) {
        node.nodes.forEach((child) => showChildren(child));
      }
    };

    showChildren(node);
  }

    /**
   * Checks or unchecks a node and its children.
   * @param {string} nodeId - The ID of the node to check or uncheck.
   * @param {boolean} state - The checked state (true for checked, false for unchecked).
   */
  checkNode(nodeId, state) {
    if (!this.nodeExists(nodeId)) return;
    const node = this.findNode(nodeId);
    const checkChildren = (node, state) => {
      if (!node) return;
      if (state) {
        this._checkedNodes.add(node.nodeId);
      } else {
        this._checkedNodes.delete(node.nodeId);
      }
      node.checked = state;
      const check = this._getElementById(
        `${this.treeName}-${node.nodeId}-check`
      );
      if (check) check.checked = state;

      if (node.nodes) {
        node.nodes.forEach((child) => checkChildren(child, state));
      }
    };

    checkChildren(node, state);
  }

  /**
 * Expands or collapses a specific node in the tree view.
 * @param {string} nodeId - The ID of the node to expand or collapse.
 * @param {boolean} state - The expanded state (true for expanded, false for collapsed).
 */
  expandNode(nodeId, state) {
    if (state) this._expandNode(nodeId);
    else this._collapseNode(nodeId);
  }

    /**
   * Removes a node from the tree.
   * @param {string} nodeId - The ID of the node to remove.
   */
  removeNode(nodeId) {
    nodeId = this._normalizeId(nodeId);
    if (!this.nodeExists(nodeId)) return;
  
    const node = this.findNode(nodeId);
  
    // Remove the node from its parent's nodes array
    if (node.parentId) {
      const parent = this.findNode(node.parentId);
      if (parent && parent.nodes) {
        parent.nodes = parent.nodes.filter((child) => child.nodeId !== nodeId);
      }
    } else {
      // If the node has no parent, it's a root node, so remove it from the tree
      this.tree = this.tree.filter((rootNode) => rootNode.nodeId !== nodeId);
    }
  
    // Remove the node from the nodeMap
    this.nodeMap.delete(nodeId);
  
    // Remove the node from the DOM
    const item = this._getElementById(`${this.treeName}-${nodeId}`);
    if (item) item.remove();
  
    // Remove the node from the visible and selected sets
    this._visibleNodes.delete(nodeId);
    this._selectedNodes.delete(nodeId);
    this._checkedNodes.delete(nodeId);
  }

  _expandNode(nodeId) {
    if (!this.nodeExists(nodeId)) return;
    const node = this.findNode(nodeId);
    node.expanded = true;
    const details = this._getElementById(
      `${this.treeName}-${node.nodeId}-details`
    );
    if (details) details.setAttribute("open", "");
  }

  _collapseNode(nodeId) {
    if (!this.nodeExists(nodeId)) return;
    const node = this.findNode(nodeId);
    node.expanded = false;
    const details = this._getElementById(
      `${this.treeName}-${node.nodeId}-details`
    );
    if (details) details.removeAttribute("open");
  }

  /**
 * Enables or disables a specific node and its children.
 * @param {string} nodeId - The ID of the node to enable or disable.
 * @param {boolean} state - The enabled state (true for enabled, false for disabled).
 */
  enableNode(nodeId, state) {
    if (state) this._enableNode(nodeId);
    else this._disableNode(nodeId);
  }

  _enableNode(nodeId) {
    if (!this.nodeExists(nodeId)) return;
    const node = this.findNode(nodeId);

    const enableChildren = (node) => {
      if (!node) return;
      node.disabled = false;
      const item = this._getElementById(`${this.treeName}-${node.nodeId}`);
      if (item) item.classList.remove("menu-disabled");
      if (node.nodes) {
        node.nodes.forEach((child) => enableChildren(child));
      }
    };
    enableChildren(node);
  }

  _disableNode(nodeId) {
    if (!this.nodeExists(nodeId)) return;
    const node = this.findNode(nodeId);

    const disableChildren = (node) => {
      if (!node) return;
      node.disabled = true;
      const item = this._getElementById(`${this.treeName}-${node.nodeId}`);
      if (item) item.classList.add("menu-disabled");
      if (node.nodes) {
        node.nodes.forEach((child) => disableChildren(child));
      }
    };
    disableChildren(node);
  }

    /**
   * Clears all nodes and resets the tree view.
   */
  clear() {
    this.nodeMap.clear();
    this.tree = [];
    this._checkedNodes.clear();
    this._selectedNodes.clear(); // Clear all selected nodes
    this._visibleNodes.clear();
  }

    /**
   * Retrieves the children of a specific node.
   * @param {string} nodeId - The ID of the node to retrieve children for.
   * @returns {Array} An array of child nodes.
   */
  getChildren(nodeId) {
    if (!this.nodeExists(nodeId)) return [];
    const node = this.findNode(nodeId);
    return Array.isArray(node.nodes) ? [...node.nodes] : [];
  }

    /**
   * Removes all children of a specific node.
   * @param {string} nodeId - The ID of the node to remove children from.
   */
  removeChildren(nodeId) {
    if (!this.nodeExists(nodeId)) return;
    const node = this.findNode(nodeId);

    if (node.nodes) {
      node.nodes.forEach((child) => this._checkedNodes.delete(child.nodeId));
      node.nodes.forEach((child) => this._selectedNodes.delete(child.nodeId));
      node.nodes.forEach((child) => this._visibleNodes.delete(child.nodeId));
      node.nodes.forEach((child) => this.removeNode(child.nodeId));
    }
    node.nodes = [];
  }

    /**
   * Updates the properties of a node.
   * @param {string} nodeId - The ID of the node to update.
   * @param {string} iconUrl - The new icon URL for the node.
   * @param {string} text - The new text content for the node.
   * @param {string} [href=""] - The new hyperlink for the node.
   */
  updateNode(nodeId, iconUrl, text, href = "") {
    nodeId = this._normalizeId(nodeId);
    iconUrl = this._cstr(iconUrl);
    text = this._cstr(text);
    href = this._cstr(href);

    if (nodeId === "") return;
    if (!this.nodeExists(nodeId)) return;
    if (iconUrl === "") iconUrl = this.settings.blankIconUrl;

    const node = this.findNode(nodeId);
    node.iconUrl = iconUrl;
    node.text = text;
    node.href = href;
    //
    const txt = this._getElementById(`${this.treeName}-${node.nodeId}-text`);
    if (txt) txt.textContent = text;

    const inp = this._getElementById(`${this.treeName}-${node.nodeId}-input`);
    if (inp) inp.value = text;

    const icon = this._getElementById(`${this.treeName}-${node.nodeId}-icon`);
    if (icon) icon.dataset.src = iconUrl;
  }

    /**
   * Selects or deselects a node and its children.
   * @param {string} nodeId - The ID of the node to select or deselect.
   * @param {boolean} state - The selected state (true for selected, false for deselected).
   */
  selectNode(nodeId, state) {
    if (!this.nodeExists(nodeId)) return;
    const node = this.findNode(nodeId);
    const selectChildren = (node, state) => {
      if (!node) return;
      if (state) {
        this._selectedNodes.add(node.nodeId);
      } else {
        this._selectedNodes.delete(node.nodeId);
      }
      node.selected = state;
      const item = this._getElementById(`${this.treeName}-${node.nodeId}`);
      if (item) {
        if (state) item.classList.add("menu-active");
        else item.classList.remove("menu-active");
      }

      if (node.nodes) {
        node.nodes.forEach((child) => selectChildren(child, state));
      }
    };
    selectChildren(node, state);
  }

    /**
   * Clears all selected nodes in the tree view.
   */
  clearSelected() {
    this._selectedNodes.forEach((child) =>
      this.selectNode(child.nodeId, false)
    );
    this._selectedNodes.clear(); // Clear all selected nodes
  }

    /**
   * Clears all checked nodes in the tree view.
   */
  clearChecked() {
    this._checkedNodes.forEach((child) => this.checkNode(child.nodeId, false));
    this._checkedNodes.clear(); // Clear all checked nodes
  }

    /**
   * Selects multiple nodes in the tree view.
   * @param {Array<string>} nodeIds - An array of node IDs to select.
   */
  selectNodes(nodeIds) {
    this._selectedNodes.forEach((child) =>
      this.selectNode(child.nodeId, false)
    );
    const normalizedIds = new Set(nodeIds.map((id) => this._normalizeId(id)));
    normalizedIds.forEach((child) => this.selectNode(child, true));
    //this._dispatchEvent('nodesSelected', { nodeIds: normalizedIds });
  }

    /**
   * Retrieves the currently selected node.
   * @param {boolean} [includeChildren=false] - Whether to include child nodes in the result.
   * @returns {Object|null} The selected node or null if no node is selected.
   */
  getSelectedNode(includeChildren = false) {
    const el = this.element.querySelector(".menu-active");
    if (!el) return null;
    const nodeId = this._normalizeId(el.dataset.id);
    const node = this.findNode(nodeId);
    if (!node || !includeChildren) return node;
    return { ...node, nodes: node.nodes ?? [] };
  }

    /**
   * Retrieves all selected nodes in the tree view.
   * @returns {Array} An array of selected node IDs.
   */
  getSelectedNodes() {
    // Return all selected nodes
    return Array.from(this._selectedNodes);
  }

    /**
   * Retrieves all checked nodes in the tree view.
   * @returns {Array} An array of checked node IDs.
   */
  getCheckedNodes() {
    return Array.from(this._checkedNodes);
  }

    /**
   * Checks multiple nodes in the tree view.
   * @param {Array<string>} nodeIds - An array of node IDs to check.
   */
  checkNodes(nodeIds) {
    this._checkedNodes.forEach((child) => this.checkNode(child.nodeId, false));
    const normalizedIds = new Set(nodeIds.map((id) => this._normalizeId(id)));
    normalizedIds.forEach((child) => this.checkNode(child, true));
    this._dispatchEvent("nodesChecked", { nodeIds: normalizedIds });
  }

    /**
   * Enables inline editing for a specific node.
   * @param {string} nodeId - The ID of the node to enable inline editing for.
   */
  enableInlineEditing(nodeId) {
    this._enableInlineEdit(nodeId);
  }

    /**
   * Refreshes the tree view by rebuilding its structure.
   */
  refresh() {
    this._refresh();
  }

  /**
   * Moves a node to the same level as its parent.
   * @param {string} nodeId - The ID of the node to move.
   */
  nodeMoveLeft(nodeId) {
    if (!this.nodeExists(nodeId)) return;

    const node = this.findNode(nodeId);
    const parentNode = this.findNode(node.parentId);

    if (!parentNode) return; // If there's no parent, the node is already at the root level

    // Update the parentId of the node to the parent's parentId
    node.parentId = parentNode.parentId;

    // Remove the node from the current parent's children
    if (parentNode.nodes) {
      parentNode.nodes = parentNode.nodes.filter((child) => child.nodeId !== nodeId);
    }

    // Add the node to the new parent's children or to the root level
    if (node.parentId) {
      const newParentNode = this.findNode(node.parentId);
      if (newParentNode) {
        newParentNode.nodes = newParentNode.nodes || [];
        newParentNode.nodes.push(node);
      }
    } else {
      this.tree.push(node); // Add to root level if no parentId
    }

    this._refresh(); // Refresh the tree view to reflect the changes
  }

  /**
   * Moves a node to the right, making it a child of its previous sibling.
   * @param {string} nodeId - The ID of the node to move.
   */
  nodeMoveRight(nodeId) {
    if (!this.nodeExists(nodeId)) return;

    const node = this.findNode(nodeId);
    const parentNode = this.findNode(node.parentId);

    if (parentNode && parentNode.nodes) {
      const index = parentNode.nodes.findIndex((child) => child.nodeId === nodeId);
      if (index > 0) {
        const newParentNode = parentNode.nodes[index - 1];
        newParentNode.nodes = newParentNode.nodes || [];
        newParentNode.nodes.push(node);
        node.parentId = newParentNode.nodeId;
        parentNode.nodes.splice(index, 1);
        this._refresh();
      } else {
        console.warn("Cannot move the first child node to the right.");
      }
    } else if (!node.parentId) {
      // Handle case where node has no parent
      const rootIndex = this.tree.findIndex((rootNode) => rootNode.nodeId === nodeId);
      if (rootIndex > 0) {
        const newParentNode = this.tree[rootIndex - 1];
        newParentNode.nodes = newParentNode.nodes || [];
        newParentNode.nodes.push(node);
        node.parentId = newParentNode.nodeId;
        this.tree.splice(rootIndex, 1);
        this._refresh();
      } else {
        console.warn("Cannot move the first root node to the right.");
      }
    } else {
      console.warn("Cannot move node to the right as it has no valid parent or sibling.");
    }
  }

  /**
   * Moves a node up within its parent's children.
   * @param {string} nodeId - The ID of the node to move.
   */
  nodeMoveUp(nodeId) {
    if (!this.nodeExists(nodeId)) return;

    const node = this.findNode(nodeId);
    const parentNode = this.findNode(node.parentId);

    if (parentNode && parentNode.nodes) {
      const index = parentNode.nodes.findIndex((child) => child.nodeId === nodeId);
      if (index > 0) {
        [parentNode.nodes[index - 1], parentNode.nodes[index]] = [
          parentNode.nodes[index],
          parentNode.nodes[index - 1],
        ];
        this._refresh();
      }
    } else if (!node.parentId) {
      // Handle case where node has no parent
      const rootIndex = this.tree.findIndex((rootNode) => rootNode.nodeId === nodeId);
      if (rootIndex > 0) {
        [this.tree[rootIndex - 1], this.tree[rootIndex]] = [
          this.tree[rootIndex],
          this.tree[rootIndex - 1],
        ];
        this._refresh();
      }
    }
  }

  /**
   * Moves a node down within its parent's children.
   * @param {string} nodeId - The ID of the node to move.
   */
  nodeMoveDown(nodeId) {
    if (!this.nodeExists(nodeId)) return;

    const node = this.findNode(nodeId);
    const parentNode = this.findNode(node.parentId);

    if (parentNode && parentNode.nodes) {
      const index = parentNode.nodes.findIndex((child) => child.nodeId === nodeId);
      if (index < parentNode.nodes.length - 1) {
        [parentNode.nodes[index], parentNode.nodes[index + 1]] = [
          parentNode.nodes[index + 1],
          parentNode.nodes[index],
        ];
        this._refresh();
      }
    } else if (!node.parentId) {
      // Handle case where node has no parent
      const rootIndex = this.tree.findIndex((rootNode) => rootNode.nodeId === nodeId);
      if (rootIndex < this.tree.length - 1) {
        [this.tree[rootIndex], this.tree[rootIndex + 1]] = [
          this.tree[rootIndex + 1],
          this.tree[rootIndex],
        ];
        this._refresh();
      }
    }
  }

  _dispatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    this.element.dispatchEvent(event);
  }

  // Event delegation for blur
  _onBlur(e) {
    const input = e.target.closest("input.xinput"); // Check if the event target is an input
    if (!input) return;

    const nodeId = this._normalizeId(input.dataset.id);
    const node = this.findNode(nodeId);
    if (!node) return;

    const txt = this._getElementById(`${this.treeName}-${nodeId}-text`);
    if (!txt) return;

    const originalText = node.text;

    if (input.value.trim() === "") {
      this._toggleVisibility(input, false);
      this._toggleVisibility(txt, true);
      this._dispatchEvent("nodeEditCancelled", { node }); // Notify about cancellation
      return;
    }
    if (input.value.trim() === originalText) {
      this._toggleVisibility(input, false);
      this._toggleVisibility(txt, true);
      this._dispatchEvent("nodeEditCancelled", { node }); // Notify about cancellation
      return;
    }

    // Update the node text
    node.text = input.value.trim();
    txt.textContent = input.value.trim();
    input.value = input.value.trim();
    this._toggleVisibility(input, false);
    this._toggleVisibility(txt, true);
    this._dispatchEvent("nodeEdited", { node });
  }

  // Event delegation for keydown
  _onKeydown(e) {
    const input = e.target.closest("input.xinput"); // Check if the event target is an input
    if (!input) return;

    const nodeId = this._normalizeId(input.dataset.id);
    const node = this.findNode(nodeId);
    if (!node) return;

    const txt = this._getElementById(`${this.treeName}-${nodeId}-text`);
    if (!txt) return;

    const originalText = node.text;

    if (e.key === "Enter") {
      input.blur(); // Trigger blur event to save changes
    } else if (e.key === "Escape") {
      // Revert changes
      node.text = originalText;
      txt.textContent = originalText;
      input.value = originalText;
      input.blur(); // Trigger blur to hide the input
    }
  }

  _enableInlineEdit(nodeId) {
    const node = this.findNode(nodeId);
    if (!node) return;

    const txt = this._getElementById(`${this.treeName}-${nodeId}-text`);
    const input = this._getElementById(`${this.treeName}-${nodeId}-input`);
    if (!txt || !input) return;

    // Set the input's value to the current text of the node
    input.value = node.text;

    // Toggle visibility for inline editing
    this._toggleVisibility(txt, false);
    this._toggleVisibility(input, true);
    input.focus();
  }

  /**
   * Returns the current tree object.
   * @returns {Array} The tree object.
   */
  getTree() {
    return this.tree;
  }

  /**
   * Flattens the tree object into an array.
   * @returns {Array} The flattened tree array.
   */
  flattenTree() {
    const flatten = (nodes) => {
      return nodes.reduce((acc, node) => {
        acc.push(node);
        if (node.nodes && node.nodes.length > 0) {
          acc = acc.concat(flatten(node.nodes));
        }
        return acc;
      }, []);
    };

    return flatten(this.tree);
  }
}
export default DaisyUITreeView;

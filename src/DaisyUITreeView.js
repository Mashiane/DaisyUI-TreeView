const DEFAULTS = {
  data: [],
  expandIconUrl: "./assets/chevron-down-solid.svg",
  collapseIconUrl: "./assets/chevron-right-solid.svg",
  hasCheckbox: false,
  treeName: "treeView", // Changed to camelCase
  multipleSelect: false,
  multipleCheck: false,
  iconHeight: "16px",
  iconWidth: "16px",
  inlineEdit: false,
  dragNDrop: false,
};

class DaisyUITreeView {
  constructor(container, options = {}) {
    this.element = container;
    this.settings = { ...DEFAULTS, ...options };
    this.treeName = this._normalizeId(this.settings.treeName);
    this.tree = [];
    this.nodeMap = new Map();
    this._checkedNodes = new Set();
    this._selectedNodes = new Set();
    this._visibleNodes = new Set();
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

  collapseAll() {
    const collapseRecursive = (nodes) => {
      for (const node of nodes) {
        this._collapseNode(node.nodeId);
        if (node.nodes) collapseRecursive(node.nodes);
      }
    };
    collapseRecursive(this.tree);
  }

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
      item.setAttribute(
        "aria-selected",
        this._selectedNodes.has(node.nodeId) || false
      );
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
        if (node.iconUrl === "") node.iconUrl = this.settings.collapseIconUrl;
        if (node.iconUrl) {
          const icon = document.createElement("svg-renderer");
          icon.id = `${this.treeName}-${node.nodeId}-icon`;
          icon.dataset.id = node.nodeId;
          icon.dataset.src = node.expanded
            ? this.settings.expandIconUrl
            : this.settings.collapseIconUrl;
          icon.classList.add("state-icon", "xicon");
          icon.setAttribute("style", "pointer-events:none;"); // Updated
          icon.setAttribute("fill", "currentColor"); // Updated
          icon.setAttribute("data-js", "enabled"); // Updated
          icon.setAttribute("width", this.settings.iconWidth);
          icon.setAttribute("height", this.settings.iconHeight);
          summary.appendChild(icon);
        }

        if (this.settings.hasCheckbox) {
          const checkbox = document.createElement("input");
          checkbox.id = `${this.treeName}-${node.nodeId}-check`;
          checkbox.type = "checkbox";
          checkbox.classList.add("checkbox");
          checkbox.dataset.id = node.nodeId;
          checkbox.checked = this._checkedNodes.has(node.nodeId);
          summary.appendChild(checkbox);
        }

        const txtBox = document.createElement("input");
        txtBox.id = `${this.treeName}-${node.nodeId}-input`;
        txtBox.type = "text";
        txtBox.value = node.text;
        txtBox.classList.add(
          "input",
          "input-ghost",
          "hidden",
          "input-sm",
          "w-full",
          "xinput"
        );
        txtBox.dataset.id = node.nodeId;
        summary.appendChild(txtBox);

        const textNode = document.createElement("span");
        textNode.id = `${this.treeName}-${node.nodeId}-text`;
        textNode.textContent = node.text;
        textNode.dataset.id = node.nodeId;
        textNode.classList.add("xspan");

        summary.appendChild(textNode);
        details.appendChild(summary);

        const nestedList = document.createElement("ul");
        nestedList.id = `${this.treeName}-${node.nodeId}-ul`;
        nestedList.dataset.id = node.nodeId;

        this._build(nestedList, node.nodes);
        details.appendChild(nestedList);

        item.appendChild(details);
      } else {
        const link = document.createElement("a");
        link.id = `${this.treeName}-${node.nodeId}-anchor`;
        link.dataset.id = node.nodeId;
        link.classList.add("xanchor");

        if (node.href) {
          link.setAttribute("href", node.href);
        }

        if (node.iconUrl) {
          const icon = document.createElement("svg-renderer");
          icon.dataset.id = node.nodeId;
          icon.id = `${this.treeName}-${node.nodeId}-icon`;
          icon.dataset.src = node.expanded
            ? this.settings.expandIconUrl
            : this.settings.collapseIconUrl;
          icon.classList.add("state-icon");
          icon.setAttribute("style", "pointer-events:none;"); // Updated
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
          "input-sm",
          "w-full",
          "xinput"
        );
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
      const icon = this._getElementById(`${this.treeName}-${id}-icon`);
      if (icon) {
        if (show) icon.setAttribute("data-src", this.settings.expandIconUrl);
        else icon.setAttribute("data-src", this.settings.collapseIconUrl);
        node.iconUrl = icon.getAttribute("data-src");
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

  addNode(parentId, nodeId, iconUrl = "", text, href = "") {
    parentId = this._normalizeId(parentId);
    nodeId = this._normalizeId(nodeId);
    iconUrl = this._cstr(iconUrl);
    text = this._cstr(text);
    href = this._cstr(href);
    //
    if (nodeId === "") return;
    if (this.nodeExists(nodeId)) return;
  
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

  expandNode(nodeId, state) {
    if (state) this._expandNode(nodeId);
    else this._collapseNode(nodeId);
  }

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

  clear() {
    this.nodeMap.clear();
    this.tree = [];
    this._checkedNodes.clear();
    this._selectedNodes.clear(); // Clear all selected nodes
    this._visibleNodes.clear();
  }

  getChildren(nodeId) {
    if (!this.nodeExists(nodeId)) return [];
    const node = this.findNode(nodeId);
    return Array.isArray(node.nodes) ? [...node.nodes] : [];
  }

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

  updateNode(nodeId, iconUrl, text, href = "") {
    nodeId = this._normalizeId(nodeId);
    iconUrl = this._cstr(iconUrl);
    text = this._cstr(text);
    href = this._cstr(href);

    if (nodeId === "") return;
    if (!this.nodeExists(nodeId)) return;

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

  clearSelected() {
    this._selectedNodes.forEach((child) =>
      this.selectNode(child.nodeId, false)
    );
    this._selectedNodes.clear(); // Clear all selected nodes
  }

  clearChecked() {
    this._checkedNodes.forEach((child) => this.checkNode(child.nodeId, false));
    this._checkedNodes.clear(); // Clear all checked nodes
  }

  selectNodes(nodeIds) {
    this._selectedNodes.forEach((child) =>
      this.selectNode(child.nodeId, false)
    );
    const normalizedIds = new Set(nodeIds.map((id) => this._normalizeId(id)));
    normalizedIds.forEach((child) => this.selectNode(child, true));
    //this._dispatchEvent('nodesSelected', { nodeIds: normalizedIds });
  }

  getSelectedNode(includeChildren = false) {
    const el = this.element.querySelector(".menu-active");
    if (!el) return null;
    const nodeId = this._normalizeId(el.dataset.id);
    const node = this.findNode(nodeId);
    if (!node || !includeChildren) return node;
    return { ...node, nodes: node.nodes ?? [] };
  }

  getSelectedNodes() {
    // Return all selected nodes
    return Array.from(this._selectedNodes);
  }

  getCheckedNodes() {
    return Array.from(this._checkedNodes);
  }

  checkNodes(nodeIds) {
    this._checkedNodes.forEach((child) => this.checkNode(child.nodeId, false));
    const normalizedIds = new Set(nodeIds.map((id) => this._normalizeId(id)));
    normalizedIds.forEach((child) => this.checkNode(child, true));
    this._dispatchEvent("nodesChecked", { nodeIds: normalizedIds });
  }

  enableInlineEditing(nodeId) {
    this._enableInlineEdit(nodeId);
  }

  refresh() {
    this._refresh();
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
}
export default DaisyUITreeView;

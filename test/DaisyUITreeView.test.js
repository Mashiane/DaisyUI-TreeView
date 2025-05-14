import { JSDOM } from 'jsdom';
import DaisyUITreeView from '../src/DaisyUITreeView';
import '@testing-library/jest-dom';


describe('DaisyUITreeView', () => {
  let container;
  let treeView;
  let node;
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><head></head><body><div id="tree"></div></body></html>`);
    global.document = dom.window.document;
    global.window = dom.window;
    document = dom.window.document;
    container = document.getElementById('tree');
    treeView = new DaisyUITreeView(container, {
      hasCheckbox: true,
      multipleSelect: false,
      multipleCheck: false,
      inlineEdit: false,
    });
    treeView.clear();
    treeView.addNode('', 'a', '', 'Node A');
    treeView.addNode('a', 'aa', '', 'Node AA');
    treeView.addNode('', 'b', '', 'Node B');
    treeView.refresh();
    //console.log(dom.serialize());
  });

  afterEach(() => {
    container = null;
    treeView = null;
    delete global.document;
    delete global.window;
  });
  
  it('should initialize with default settings', () => {
    expect(treeView.settings.hasCheckbox).toBe(true);
    expect(treeView.settings.multipleSelect).toBe(true);
  });

  it('should add a new node', () => {    
    treeView.addNode('', 'c', '', 'Node C');
    treeView.refresh();
    node = treeView.findNode('c');
    expect(node).not.toBeNull();
    expect(node.text).toBe('Node C');
  });

  it('should remove a node', () => {
    treeView.addNode('', 'c', '', 'Node C');
    treeView.refresh();
    treeView.removeNode('c')
    expect(treeView.nodeExists('c')).toBe(false);
  });

  it('should expand and collapse a node', () => {
    treeView.expandNode('a', true);
    expect(treeView.findNode('a').expanded).toBe(true);
    treeView.expandNode('a', false);
    expect(treeView.findNode('a').expanded).toBe(false);
  });


  it('should select and deselect a node', () => {
    treeView.selectNode('a', true);
    expect(treeView.getSelectedNode().nodeId).toBe('a');
    const nodeA = document.getElementById(`${treeView.treeName}-a`);
    expect(nodeA.classList.contains('menu-active')).toBe(true);
    treeView.selectNode('a', false);
    node = treeView.getSelectedNode();
    expect(node).toBeNull();
  });

  it('should check and uncheck nodes', () => {
    treeView.checkNode('a', true);
    expect(treeView.getCheckedNodes()).toContain('a');
    expect(treeView.getCheckedNodes()).toContain('aa');

    treeView.checkNode('a', false);
    expect(treeView.getCheckedNodes()).not.toContain('a');
    expect(treeView.getCheckedNodes()).not.toContain('aa');
  });

  it('should update node text', () => {
    treeView.updateNode('a', '', 'Updated Node A', '');
    expect(treeView.findNode('a').text).toBe('Updated Node A');
  });

  it('should enforce multiple select using selectNode', () => {
    treeView.selectNode('a', true);
    treeView.selectNode('b', true);
    expect(treeView.getSelectedNodes().length).toBe(3);
  });

  it('should handle parent-child checkbox updates', () => {
    treeView.addNode('', 'parent', '', 'Parent Node');
    treeView.addNode('parent', 'child', '', 'Child Node');
    treeView.refresh();

    treeView.checkNode('parent', true);
    expect(treeView.getCheckedNodes()).toContain('parent');
    expect(treeView.getCheckedNodes()).toContain('child');
  });

  it('should expand all nodes', () => {
    treeView.expandAll();
    expect(treeView.tree.every(node => node.expanded)).toBe(true);
  });

  it('should collapse all nodes', () => {
    treeView.expandAll();
    treeView.collapseAll();
    expect(treeView.tree.every(node => !node.expanded)).toBe(true);
  });

  it('should disable and enable a node', () => {
    treeView.enableNode('a', false);
    const node = treeView.findNode('a');
    expect(node.disabled).toBe(true);

    treeView.enableNode('a', true);
    expect(node.disabled).toBe(false);
  });

  it('should select multiple nodes using selectNodes', () => {
    treeView.selectNodes(['a', 'b']);
    const selectedNodes = treeView.getSelectedNodes();
    expect(selectedNodes).toEqual(['a', 'aa', 'b']);
});

it('should return an empty array if no nodes are selected', () => {
    const selectedNodes = treeView.getSelectedNodes();
    expect(selectedNodes).toEqual([]);
});

it('should update selected nodes when selectNodes is called again', () => {
    treeView.addNode('', 'c', '', 'Node C');
    treeView.refresh();
    treeView.selectNodes(['a']);
    treeView.selectNodes(['b', 'c']);
    const selectedNodes = treeView.getSelectedNodes();
    expect(selectedNodes).toEqual(['a', 'aa', 'b', 'c']);
});

  it('should clear all nodes', () => {
    treeView.clear();
    treeView.refresh();
    expect(treeView.tree.length).toBe(0);
    expect(treeView.getCheckedNodes().length).toBe(0);
    expect(treeView.getSelectedNodes().length).toBe(0);
  });

  it('should hide a node and its children', () => {
    treeView.hideNode('a');
    const nodeA = document.getElementById(`${treeView.treeName}-a`);
    const nodeAA = document.getElementById(`${treeView.treeName}-aa`);

    expect(nodeA.classList.contains('hidden')).toBe(true);
    expect(nodeAA.classList.contains('hidden')).toBe(true);
    
    expect(treeView.findNode('a').visible).toBe(false);
    expect(treeView.findNode('aa').visible).toBe(false);
  });

  it('should show a node and its children', () => {
    treeView.hideNode('a'); // First hide the node
    treeView.showNode('a'); // Then show it again
    const nodeA = document.getElementById(`${treeView.treeName}-a`);
    const nodeAA = document.getElementById(`${treeView.treeName}-aa`);

    expect(nodeA.classList.contains('hidden')).toBe(false);
    expect(nodeAA.classList.contains('hidden')).toBe(false);

    expect(treeView.findNode('a').visible).toBe(true);
    expect(treeView.findNode('aa').visible).toBe(true);
  });

  it('should not throw an error when hiding a non-existent node', () => {
    expect(() => treeView.hideNode('nonexistent')).not.toThrow();
  });

  it('should not throw an error when showing a non-existent node', () => {
    expect(() => treeView.showNode('nonexistent')).not.toThrow();
  });

  it('should move a node to the same level as its parent', () => {
    treeView.addNode('a', 'aaa', '', 'Node AAA'); // Add a child node to Node AA
    treeView.refresh();

    treeView.nodeMoveLeft('aa'); // Move Node AA to the same level as Node A

    const movedNode = treeView.findNode('aa');
    expect(movedNode.parentId).toBe(''); // Node AA should now be at the root level

    const parentNode = treeView.findNode('a');
    expect(parentNode.nodes).not.toContain(movedNode); // Node AA should no longer be a child of Node A

    const rootNodes = treeView.tree.map(node => node.nodeId);
    expect(rootNodes).toContain('aa'); // Node AA should now be a root node
  });

  it('should move a node to the right as a child of its previous sibling', () => {
    treeView.addNode('a', 'aaa', '', 'Node AAA'); // Add a sibling node to Node AA
    treeView.addNode('a', 'aab', '', 'Node AAB'); // Add another sibling node to Node AA
    treeView.refresh();

    treeView.nodeMoveRight('aab'); // Move Node AAB to the right

    const movedNode = treeView.findNode('aab');
    expect(movedNode.parentId).toBe('aaa'); // Node AAB should now be a child of Node AAA

    const newParentNode = treeView.findNode('aaa');
    expect(newParentNode.nodes).toContain(movedNode); // Node AAB should now be in Node AAA's children
  });

  it('should handle moving a node to the right when parent ID is blank', () => {
    treeView.addNode('', 'root1', '', 'Root Node 1'); // Add a root node
    treeView.addNode('', 'root2', '', 'Root Node 2'); // Add another root node
    treeView.refresh();

    treeView.nodeMoveRight('root2'); // Attempt to move Root Node 2 to the right

    const movedNode = treeView.findNode('root2');
    expect(movedNode.parentId).toBe('root1'); // Root Node 2 should now be a child of Root Node 1

    const newParentNode = treeView.findNode('root1');
    expect(newParentNode.nodes).toContain(movedNode); // Root Node 2 should now be in Root Node 1's children
  });

  it('should move a node up within its parent', () => {
    treeView.addNode('a', 'aaa', '', 'Node AAA'); // Add a sibling node to Node AA
    treeView.refresh();

    treeView.nodeMoveUp('aaa'); // Move Node AAA up

    const parentNode = treeView.findNode('a');
    const childNodes = parentNode.nodes.map(node => node.nodeId);
    expect(childNodes).toEqual(['aaa', 'aa']); // Node AAA should now be before Node AA
  });

  it('should move a node down within its parent', () => {
    treeView.addNode('a', 'aaa', '', 'Node AAA'); // Add a sibling node to Node AA
    treeView.refresh();

    treeView.nodeMoveDown('aa'); // Move Node AA down

    const parentNode = treeView.findNode('a');
    const childNodes = parentNode.nodes.map(node => node.nodeId);
    expect(childNodes).toEqual(['aaa', 'aa']); // Node AA should now be after Node AAA
  });

});
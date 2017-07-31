/*******************************************************************************
* Copyright 2017 IBM Corp.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not
* use this file except in compliance with the License. You may obtain a copy of
* the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations under
* the License.
******************************************************************************/

'use strict';

let profiling_enabled = false;

function treeNodeMatchesProfileNode(tree_node, profile_node) {
  if (tree_node.file == profile_node.file &&
    tree_node.name == profile_node.name &&
    tree_node.line == profile_node.line) {
    return true;
  }
  return false;
}

function addOrUpdateTreeNode(tree_root, indexed_nodes, profile_node) {
  if (treeNodeMatchesProfileNode(tree_root, profile_node)) {
    tree_root.count += profile_node.count;
    return;
  }

  // Build a path of function names so we can search up from the root of
  // the tree.
  // console.log("Inserting " + profile_node.name + " into tree");
  let path = [];
  let current_node = profile_node;

  while (current_node) {
    path.unshift(current_node);
    current_node = indexed_nodes[current_node.parent];
  }

  let tree_node = tree_root;
  let children = tree_node.children;
  if (!treeNodeMatchesProfileNode(tree_root, path[0])) {
    console.error("We didn't end up at root!");
    // console.log("Root: ");
    // console.dir(tree_root);
    // console.log("Path: ");
    // console.dir(path);
  }

  // Find the parent for this node.
  for (let path_node of path.slice(1)) {
    // Need to follow the children from root to find where this
    // node slots in. Should not require parent to have been created.
    // (In practise it probably will be.)
    let next_tree_node = null;
    for (let child of children) {
      if (treeNodeMatchesProfileNode(child, path_node)) {
        // console.log("Re-using node for " + path_node.name);
        next_tree_node = child;
        break;
      }
    }
    if (!next_tree_node) {
      // console.log("Adding node for " + path_node.name);
      next_tree_node = new TreeNode(path_node.name, path_node.file, path_node.line, tree_node);
    }
    tree_node = next_tree_node;
    children = tree_node.children;
  }

  // Add the ticks from this profiling node
  // (add since we may already have tick from a previous sample)
  tree_node.addTicks(profile_node.count);
}

function clearProfilingData() {
  clearFlameGraph();
  tree_root = new TreeNode('(root)', '', 0);
  refreshFlameGraph();
}

// Initialise the graph to something very boring.
let tree_root = new TreeNode('(root)', '', 0);

socket.on('status', (statusMessage) => {
  let status = JSON.parse(statusMessage);
  profiling_enabled = status['profiling_enabled'];
  let anchor = document.getElementById('toggle-profiling');
  anchor.innerHTML = profiling_enabled ? 'Disable Profiling' : 'Enable Profiling';
});

socket.on('profiling', (profilingSample) => {

  // console.log("Building tree...");
  // console.log("Adding sample: " + profiling_row.time);
  // console.dir(profiling_row);

  let profiling_row = JSON.parse(profilingSample);  // parses the data into a JSON array
  let indexed_nodes = {};
  // Index this so we can find parents faster.
  profiling_row.functions.map((node) => { indexed_nodes[node.self] = node; });
  for (let fn_details of profiling_row.functions) {
    if (fn_details.name == '(program)') {
      continue;
    }
    // console.log("Inserting node into tree...");
    // console.dir(tree_root);
    addOrUpdateTreeNode(tree_root, indexed_nodes, fn_details);
  }
  // console.log("Tree is:");
  // console.dir(tree_root);
  refreshFlameGraph();
});

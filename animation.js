// --- animation.js ---

const canvas = document.getElementById('flowCanvas');
const ctx = canvas.getContext('2d');

// --- 1. Định nghĩa cấu trúc đồ thị ---
// nodes: key là ID nút, value là object chứa tọa độ (x, y) và danh sách các nút đầu ra (outputs)
const graph = {
  'A': { x: 100, y: 300, outputs: ['B', 'C', 'D'], color: 'red' },
  'B': { x: 350, y: 100, outputs: ['E'], color: 'blue' },
  'C': { x: 350, y: 300, outputs: ['E', 'F'], color: 'green' },
  'D': { x: 350, y: 500, outputs: ['F'], color: 'purple' },
  'E': { x: 600, y: 200, outputs: ['G'], color: 'orange' },
  'F': { x: 600, y: 400, outputs: ['G'], color: 'teal' },
  'G': { x: 700, y: 300, outputs: ['A'], color: 'magenta' } // Nút cuối cùng trỏ về A
};

const nodeRadius = 20;
const signalRadius = 5;
const signalSpeed = 0.01; // Tốc độ di chuyển (tỉ lệ % của đường đi mỗi frame)

// Mảng lưu trữ các tín hiệu đang hoạt động
let activeSignals = []; // Mỗi phần tử: { startNodeId, targetNodeId, progress, color }

// Hàm tiện ích: Tính toán nội suy tuyến tính (Linear Interpolation)
function lerp(start, end, t) {
  return start + (end - start) * t;
}

// Hàm tiện ích: Lấy tọa độ nút từ ID
function getNodeCoords(nodeId) {
  return graph[nodeId] ? { x: graph[nodeId].x, y: graph[nodeId].y } : null;
}

// --- 3. Vẽ nền tĩnh ---
function drawStaticGraph() {
  // Vẽ các đường nối (Edges)
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 2;
  for (const nodeId in graph) {
    const startNode = graph[nodeId];
    if (startNode.outputs) {
      startNode.outputs.forEach(targetId => {
        const endNode = graph[targetId];
        if (endNode) {
          ctx.beginPath();
          ctx.moveTo(startNode.x, startNode.y);
          ctx.lineTo(endNode.x, endNode.y);
          ctx.stroke();
        }
      });
    }
  }

  // Vẽ các nút (Nodes)
  ctx.lineWidth = 1;
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const nodeId in graph) {
    const node = graph[nodeId];
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = node.color || 'grey';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
    // Vẽ ID nút
    ctx.fillStyle = 'white';
    ctx.fillText(nodeId, node.x, node.y);
  }
}

// --- 4 & 5. Tạo, quản lý và vẽ tín hiệu ---
function drawSignals() {
  activeSignals.forEach(signal => {
    const startCoords = getNodeCoords(signal.startNodeId);
    const endCoords = getNodeCoords(signal.targetNodeId);

    if (startCoords && endCoords) {
      // Tính vị trí hiện tại của tín hiệu bằng lerp
      const currentX = lerp(startCoords.x, endCoords.x, signal.progress);
      const currentY = lerp(startCoords.y, endCoords.y, signal.progress);

      // Vẽ tín hiệu
      ctx.beginPath();
      ctx.arc(currentX, currentY, signalRadius, 0, Math.PI * 2);
      ctx.fillStyle = signal.color || 'black';
      ctx.fill();
    }
  });
}

function updateSignals() {
  const arrivedSignals = []; // Lưu các tín hiệu vừa đến đích

  for (let i = activeSignals.length - 1; i >= 0; i--) {
    const signal = activeSignals[i];
    signal.progress += signalSpeed;

    // Kiểm tra nếu đã đến đích (hoặc vượt qua)
    if (signal.progress >= 1) {
      signal.progress = 1; // Đảm bảo nó ở đúng vị trí cuối
      arrivedSignals.push(signal); // Thêm vào danh sách đã đến
      activeSignals.splice(i, 1); // Xóa khỏi danh sách đang hoạt động
    }
  }

  // --- 6. Xử lý tín hiệu đã đến ---
  arrivedSignals.forEach(arrivedSignal => {
    console.log(`Signal from ${arrivedSignal.startNodeId} arrived at ${arrivedSignal.targetNodeId}`);
    const targetNodeId = arrivedSignal.targetNodeId;
    const targetNodeData = graph[targetNodeId];

    // Nếu nút đích có các đường ra tiếp theo
    if (targetNodeData && targetNodeData.outputs && targetNodeData.outputs.length > 0) {
       // Nếu về A thì dừng hoặc làm gì đó
       if (targetNodeId === 'A') {
           console.log("Cycle complete! Animation might stop or reset here.");
           // Có thể dừng vòng lặp: cancelAnimationFrame(animationFrameId);
           // Hoặc chỉ đơn giản là không tạo tín hiệu mới từ A nữa nếu không muốn lặp vô hạn
           // return; // Bỏ qua việc tạo tín hiệu mới từ A nếu muốn dừng ở đây
       }

      // Tạo các tín hiệu mới bắt đầu từ nút đích này
      targetNodeData.outputs.forEach(nextTargetId => {
        if (graph[nextTargetId]) { // Đảm bảo nút đích tiếp theo tồn tại
           console.log(` -> Triggering new signal from ${targetNodeId} to ${nextTargetId}`);
           activeSignals.push({
             startNodeId: targetNodeId,
             targetNodeId: nextTargetId,
             progress: 0, // Bắt đầu từ đầu
             color: targetNodeData.color || 'black' // Lấy màu của nút nguồn
           });
        }
      });
    } else if (targetNodeId === 'A') {
         console.log("Cycle complete! Signal arrived back at A.");
         // Dừng hoặc xử lý kết thúc
    }
  });
}

// --- 7. Vòng lặp hoạt ảnh ---
let animationFrameId;
function animationLoop() {
  // Xóa toàn bộ canvas trước khi vẽ lại
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Vẽ lại nền tĩnh
  drawStaticGraph();

  // Cập nhật trạng thái các tín hiệu
  updateSignals();

  // Vẽ các tín hiệu ở vị trí mới
  drawSignals();

  // Yêu cầu trình duyệt vẽ lại khung hình tiếp theo
  animationFrameId = requestAnimationFrame(animationLoop);
}

// --- Khởi động ---
function startAnimation() {
    console.log("Starting animation from node A...");
    activeSignals = []; // Đảm bảo bắt đầu sạch sẽ
    const startNodeId = 'A';
    const startNodeData = graph[startNodeId];

    if (startNodeData && startNodeData.outputs) {
        startNodeData.outputs.forEach(targetId => {
            if (graph[targetId]) {
                 activeSignals.push({
                     startNodeId: startNodeId,
                     targetNodeId: targetId,
                     progress: 0,
                     color: startNodeData.color || 'black'
                 });
            }
        });
    }
    // Hủy bỏ frame cũ nếu có và bắt đầu vòng lặp mới
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationLoop();
}

// Bắt đầu hoạt ảnh khi script được tải
startAnimation();

// Optional: Thêm nút để bắt đầu lại hoạt ảnh
// document.getElementById('startButton').addEventListener('click', startAnimation);
"""Efeito 3D (paralaxe) a partir de uma unica imagem: estima profundidade e move uma camera virtual.

Uso: python3 -I parallax3d.py <scratchpad> <imagem> <saida.mp4> [segundos] [movimento: orbita|subida|aproxima] [largura] [altura]
"""
import sys, subprocess
S = sys.argv[1]
sys.path.insert(0, f"{S}/tools/cv")
import cv2, numpy as np, onnxruntime as ort

img_path, out_path = sys.argv[2], sys.argv[3]
secs = float(sys.argv[4]) if len(sys.argv) > 4 else 3.0
move = sys.argv[5] if len(sys.argv) > 5 else "orbita"
W = int(sys.argv[6]) if len(sys.argv) > 6 else 1080
H = int(sys.argv[7]) if len(sys.argv) > 7 else 1920
FPS = 30

img = cv2.imread(img_path)
# profundidade (Depth Anything V2 small)
sess = ort.InferenceSession(f"{S}/models/da2/model.onnx", providers=["CPUExecutionProvider"])
x = cv2.resize(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), (518, 518), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255
x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
d = sess.run(None, {sess.get_inputs()[0].name: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
d = cv2.resize(d, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_CUBIC)
d = (d - d.min()) / (d.max() - d.min() + 1e-6)
d = cv2.GaussianBlur(d, (0, 0), 3)
cv2.imwrite(out_path.replace(".mp4", "_profundidade.png"), (d * 255).astype(np.uint8))

# escala para cobrir o quadro vertical
sc = max(W / img.shape[1], H / img.shape[0]) * 1.12
big = cv2.resize(img, None, fx=sc, fy=sc, interpolation=cv2.INTER_LANCZOS4)
big = cv2.addWeighted(big, 1.5, cv2.GaussianBlur(big, (0, 0), 3), -0.5, 0)  # nitidez leve
dbig = cv2.resize(d, (big.shape[1], big.shape[0]), interpolation=cv2.INTER_LINEAR)
BH, BW = big.shape[:2]

n = int(round(secs * FPS))
u, v = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
proc = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
                         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "fast",
                         "-crf", "16", "-pix_fmt", "yuv420p", out_path], stdin=subprocess.PIPE)
for i in range(n):
    t = i / max(n - 1, 1)
    e = t * t * (3 - 2 * t)  # suaviza inicio e fim
    if move == "orbita":      # camera desliza de lado: predio gira em relacao ao ceu
        cam_x, cam_y, zoom = -1 + 2 * e, 0.0, 1.0 + 0.06 * e
        pan_x = (BW - W / zoom) * (0.3 + 0.4 * e)
        pan_y = (BH - H / zoom) * 0.5
    elif move == "subida":    # camera sobe pela fachada, como um drone
        cam_x, cam_y, zoom = 0.0, 1 - 2 * e, 1.04
        pan_x = (BW - W / zoom) * 0.5
        pan_y = (BH - H / zoom) * (0.9 - 0.8 * e)
    else:                     # aproxima: empurra a camera em direcao ao predio
        cam_x, cam_y, zoom = 0.0, 0.0, 1.0 + 0.16 * e
        pan_x = (BW - W / zoom) * 0.5
        pan_y = (BH - H / zoom) * 0.5
    xs = pan_x + u / zoom
    ys = pan_y + v / zoom
    dd = cv2.remap(dbig, xs, ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    amp = 46.0 * W / 1080
    push = (zoom - 1) * 0.9 if move == "aproxima" else 0.0
    xs2 = xs - (dd - 0.4) * amp * cam_x - (dd - 0.3) * push * (xs - BW / 2)
    ys2 = ys - (dd - 0.4) * amp * cam_y - (dd - 0.3) * push * (ys - BH / 2)
    frame = cv2.remap(big, xs2.astype(np.float32), ys2.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    proc.stdin.write(frame.tobytes())
proc.stdin.close(); proc.wait()
print("ok", out_path, n, "quadros")

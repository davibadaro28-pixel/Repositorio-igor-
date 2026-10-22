"""Alinha e faz a media de varios quadros da placa (reduz ruido) e recorta o predio."""
import sys, glob
sys.path.insert(0, sys.argv[1] + "/tools/cv")
import cv2, numpy as np
S = sys.argv[1]
files = sorted(glob.glob(f"{S}/predio/fr/f_*.png"))[11:23]
ref = cv2.imread(f"{S}/predio/fr/f_16.png")
mask = np.zeros(ref.shape[:2], np.uint8); mask[200:1100, 120:780] = 255  # so a placa, sem o corretor
orb = cv2.ORB_create(4000)
kr, dr = orb.detectAndCompute(cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY), mask)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
acc, n = np.zeros(ref.shape, np.float64), 0
for f in files:
    im = cv2.imread(f)
    k, d = orb.detectAndCompute(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), mask)
    m = sorted(bf.match(d, dr), key=lambda x: x.distance)[:600]
    src = np.float32([k[x.queryIdx].pt for x in m]); dst = np.float32([kr[x.trainIdx].pt for x in m])
    Hm, inl = cv2.findHomography(src, dst, cv2.RANSAC, 2.0)
    acc += cv2.warpPerspective(im, Hm, (ref.shape[1], ref.shape[0]), flags=cv2.INTER_LANCZOS4); n += 1
    print(f.split("/")[-1], int(inl.sum()))
avg = (acc / n).clip(0, 255).astype(np.uint8)
crop = avg[330:1065, 150:760].copy()
# remove o arco dourado da placa que encosta no predio (canto inferior direito)
hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
gold = cv2.inRange(hsv, (8, 60, 90), (30, 255, 255))
gold[:, :430] = 0
gold = cv2.dilate(gold, np.ones((7, 7), np.uint8))
crop = cv2.inpaint(crop, gold, 7, cv2.INPAINT_TELEA)
cv2.imwrite(f"{S}/predio/predio_media.png", crop)
print("ok", crop.shape)

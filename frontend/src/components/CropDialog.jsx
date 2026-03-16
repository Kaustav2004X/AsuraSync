import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Slider, Box, Typography,
} from "@mui/material";

const P  = "#7F1CE2";
const PD = "#5A0FB0";

async function getCroppedImg(imageSrc, pixelCrop) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx    = canvas.getContext("2d");
      canvas.width  = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
      );
      canvas.toBlob(blob => resolve(blob), "image/webp", 0.92);
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

export default function CropDialog({ open, imageSrc, aspect, circular, title, onClose, onCropDone }) {
  const [crop, setCrop]                         = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                         = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, cap) => setCroppedAreaPixels(cap), []);

  const handleDone = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCropDone(blob);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { background: "#12121A", border: "1px solid rgba(127,28,226,0.25)" } }}>
      <DialogTitle sx={{ color: "#F0EAE0", fontFamily: "'Bebas Neue', cursive", letterSpacing: "0.05em", fontSize: 20 }}>
        {title || "CROP IMAGE"}
      </DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Box sx={{ position: "relative", height: 300, background: "#0A0A0F", borderRadius: 2, overflow: "hidden" }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect || 1}
              cropShape={circular ? "round" : "rect"}
              showGrid={!circular}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </Box>
        <Box sx={{ mt: 2.5, px: 1 }}>
          <Typography sx={{ fontSize: 11, color: "#9A8AB0", mb: 1, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Zoom
          </Typography>
          <Slider
            value={zoom} min={1} max={3} step={0.05}
            onChange={(_, v) => setZoom(v)}
            sx={{
              color: P,
              "& .MuiSlider-track": { background: `linear-gradient(90deg, ${P}, #A855F7)` },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ color: "#9A8AB0" }}>Cancel</Button>
        <Button variant="contained" onClick={handleDone}
          sx={{ background: `linear-gradient(135deg, ${P}, ${PD})` }}>
          Apply Crop
        </Button>
      </DialogActions>
    </Dialog>
  );
}
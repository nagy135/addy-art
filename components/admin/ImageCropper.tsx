'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageCropperProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  /**
   * Optional callback to completely skip cropping and use the original image.
   * When provided, a "Use Original Image" button will be shown.
   */
  onUseOriginal?: () => void;
};

type AspectRatio = 'single' | 'double';

const ASPECT_RATIOS: Record<AspectRatio, number> = {
  single: 1, // 1:1 square for single column
  double: 2, // 2:1 landscape for double column (2 columns in 3-column grid)
};

export function ImageCropper({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  onUseOriginal,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('single');
  const [cropping, setCropping] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas size to match the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Return as blob with high quality
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        },
        'image/jpeg',
        0.95 // High quality (0.95 = 95% quality)
      );
    });
  };

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const handleCropComplete = useCallback(
    (_croppedArea: CropArea, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleApplyCrop = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setCropping(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
      onOpenChange(false);
      // Reset state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspectRatio('single');
      setCroppedAreaPixels(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image');
    } finally {
      setCropping(false);
    }
  }, [imageSrc, croppedAreaPixels, onCropComplete, onOpenChange]);

  // Reset crop area when aspect ratio changes
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
  }, [aspectRatio]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open && imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAspectRatio('single');
      setCroppedAreaPixels(null);
    }
  }, [open, imageSrc]);

  const handleCancel = () => {
    onOpenChange(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspectRatio('single');
    setCroppedAreaPixels(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Select aspect ratio and crop your image, or use the original without cropping using the
            button below. Quality will be preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Aspect Ratio
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={aspectRatio === 'single' ? 'default' : 'outline'}
                onClick={() => setAspectRatio('single')}
                className="flex-1"
                title="Single Column (1:1 Square)"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={aspectRatio === 'double' ? 'default' : 'outline'}
                onClick={() => setAspectRatio('double')}
                className="flex-1"
                title="Double Column (2:1 Wide)"
              >
                <div className="flex gap-1">
                  <Square className="h-4 w-4" />
                  <Square className="h-4 w-4" />
                </div>
              </Button>
            </div>
          </div>
          <div className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT_RATIOS[aspectRatio]}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={handleCropComplete}
              cropShape="rect"
              showGrid={true}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                },
              }}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Zoom:</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-12 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {onUseOriginal && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onUseOriginal();
                onOpenChange(false);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setAspectRatio('single');
                setCroppedAreaPixels(null);
              }}
            >
              Use Original Image
            </Button>
          )}
          <Button
            type="button"
            onClick={handleApplyCrop}
            disabled={cropping || !croppedAreaPixels}
          >
            {cropping ? 'Cropping...' : 'Apply Crop'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


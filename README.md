## Sleek Shrimp

### Media editor
- Uses Canvas 2D with optimizations: OffScreenCanvas, typed arrays, reduced canvas re-renders
- All the tabs are implemented:
  - **Enhance**: all the filters
  - **Crop**: cropping (cropping area is resizable, draggable, supports different aspect ratio), rotating, flipping
  - **Text**: supports adding text with different fonts, colors, sizes and styles. Text area is resizable, draggable, rotatable. Supports multi-line text
  - **Draw**: Supports all the brushes, colors, sizes. Uses Catmull-Rom spline to draw smooth lines. Pens respond to speed of the mouse movement and adjust the thickness with animation
  - **Stickers**: Supports inserting all the 3 types of stickers (static, animated, video). Stickers are resizable, draggable, rotatable. But only static version of sticker is used, no GIF conversion
- WebK code was reused for consistency: sticker selector, ripple effect, color picker
- All the tabs support undo/redo, the undo limit is 15
- Tested in desktop versions of Chrome, Firefox, Safari. Doesn't support mobile version
- Hotkeys: Backspace to remove sticker, Ctrl/Cmd+Backspace to remove text, Escape to stop selecting an entity, Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z to undo/redo
- No external dependencies introduced

### Multiple accounts
- Only nested menu has been implemented in time

### Scrolling issue
- Hasn't been addressed

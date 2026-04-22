# Design System Strategy: Serene Clinical

## 1. Overview & Creative North Star
**The Creative North Star: "The Ethereal Sanctuary"**

This design system rejects the sterile, cold nature of traditional medical interfaces in favor of an "Ethereal Sanctuary." We are building a digital environment that breathes. By combining the authoritative structure of clinical data with the soft, organic qualities of a high-end wellness retreat, we create a space that feels both medically sound and emotionally supportive.

To break the "template" look, we move away from rigid, boxed-in layouts. Instead, we utilize **intentional asymmetry**—offsetting headings and using generous white space to guide the eye. We favor **overlapping elements** (e.g., a serif headline bleeding slightly over the edge of a glass container) to create a sense of tactile depth and bespoke editorial craftsmanship.

---

## 2. Colors & Surface Architecture

Our palette is anchored in organic warmth. We move away from the "high-contrast blue" of legacy tech and toward a tonal, monochromatic harmony of sage and slate.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through background color shifts or tonal transitions.
*   *Correct:* A `surface-container-low` (#F2F4F4) section sitting on a `surface` (#F9F9F9) background.
*   *Incorrect:* A grey line separating a header from a body.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine vellum.
*   **Base:** `surface` (#F9F9F9) is your canvas.
*   **Depth Level 1:** Use `surface-container-low` (#F2F4F4) for secondary content areas or sidebars.
*   **Depth Level 2:** Use `surface-container-lowest` (#FFFFFF) for high-priority cards or interactive elements to make them "pop" against the off-white base.

### The "Glass & Gradient" Rule
To elevate the experience, use **Glassmorphism** for floating elements (modals, dropdowns, navigation bars). 
*   **Recipe:** Apply `surface` at 70% opacity with a `backdrop-blur` of 12px–20px. 
*   **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#4C6455) to `primary-dim` (#405849) at a 135-degree angle. This adds a "soulful" weight that flat color cannot replicate.

---

## 3. Typography: The Editorial Balance

We use a high-contrast typographic pairing to signal both precision (Inter) and empathy (Noto Serif).

*   **Display & Headlines (Noto Serif):** These are our "Editorial Moments." Use `display-lg` to `headline-sm` for page titles and section headers. The serif typeface conveys wisdom and history, softening the clinical nature of the data.
*   **UI & Body (Inter):** For everything functional. Inter provides the "Clinical" clarity needed for readability. Use `body-lg` (16px) for standard reading and `label-md` for metadata.
*   **Visual Rhythm:** Always lead with a Noto Serif headline. Ensure it has ample "breathing room" (at least 48px–64px of top margin) to establish a calm, unhurried pace.

---

## 4. Elevation & Depth

In this system, elevation is a feeling, not a shadow effect.

*   **The Layering Principle:** Avoid the "box shadow" button. Instead, achieve lift by placing a `surface-container-lowest` (#FFFFFF) card on a `surface-container` (#EBEEEF) background. The subtle shift in hex code creates a sophisticated, natural lift.
*   **Ambient Shadows:** Where floating elements (like a floating action button or a modal) are required, use an "Ambient Shadow":
    *   **Blur:** 16px to 24px.
    *   **Spread:** -4px.
    *   **Color:** `on-surface` (#2D3435) at 4% to 6% opacity. This mimics a natural shadow cast by soft, diffused clinical lighting.
*   **The Ghost Border Fallback:** If accessibility requirements demand a border, use the `outline-variant` (#ADB3B4) at 15% opacity. Never use 100% opacity for lines.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary` to `primary-dim`. `roundness-md` (0.75rem). Text is `on-primary` (#E3FEEB).
*   **Secondary:** `surface-container-highest` (#DDE4E5) background with `on-surface` text. No border.
*   **Tertiary:** No background. `primary` text with a 2px underline that appears only on hover.

### Input Fields
*   **Style:** No bottom line or full border. Use a subtle background fill of `surface-container-low` (#F2F4F4). 
*   **Focus State:** Shift background to `surface-container-lowest` (#FFFFFF) and apply a 1px "Ghost Border" of `primary` at 30% opacity.

### Cards & Lists
*   **The Forbiddance:** Dividers are banned. 
*   **The Solution:** Use vertical white space from our spacing scale (e.g., 24px or 32px) to separate list items. For cards, use a `surface-container-lowest` fill with the signature 16px blur ambient shadow.

### Signature Component: The "Wellness Card"
A specialized card type for health metrics. Use a glassmorphic background (`surface` @ 60% + blur) with a Noto Serif headline and a subtle sage green (`primary-container`) icon. This represents the "Serene" aspect of the system.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts where one column is significantly wider than the other to create an editorial feel.
*   **Do** use `on-surface-variant` (#5A6061) for secondary text to maintain a soft, low-fatigue reading experience.
*   **Do** ensure that 40% of every screen is "negative space." This reduces cognitive load in a clinical context.

### Don't
*   **Don't** use pure #000000. Our darkest text is `on-surface` (#2D3435).
*   **Don't** use sharp corners. Use the `DEFAULT` (0.5rem) or `md` (0.75rem) roundedness for everything to maintain a "gentle" touch.
*   **Don't** use standard blue for links. Use `primary` (#4C6455) or `secondary` (#55625F) to stay within the sage/slate palette.
*   **Don't** crowd information. If a screen feels full, it is broken. Split it into multiple layers or steps.

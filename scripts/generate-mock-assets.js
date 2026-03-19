
/**
 * Script to generate mock furniture assets data for the standalone demo
 * Uses the same logic as assetLoader.ts from the main extension
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

// Configuration
const assetsRoot = path.join(__dirname, '..');
const furnitureDir = path.join(assetsRoot, 'assets', 'furniture');
const outputPath = path.join(assetsRoot, 'mock-assets.json');

// Constants (matching constants.ts)
const PNG_ALPHA_THRESHOLD = 50;

// Convert PNG RGBA to hex color
function rgbaToHex(r, g, b, a) {
  if (a &lt; PNG_ALPHA_THRESHOLD) return '';
  const rgb =
    `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  if (a &gt;= 255) return rgb;
  return `${rgb}${a.toString(16).padStart(2, '0').toUpperCase()}`;
}

// Parse PNG buffer to sprite data
function pngToSpriteData(pngBuffer, width, height) {
  try {
    const png = PNG.sync.read(pngBuffer);

    if (png.width !== width || png.height !== height) {
      console.warn(
        `PNG dimensions mismatch: expected ${width}×${height}, got ${png.width}×${png.height}`,
      );
    }

    const sprite = [];
    const data = png.data;

    for (let y = 0; y &lt; height; y++) {
      const row = [];
      for (let x = 0; x &lt; width; x++) {
        const pixelIndex = (y * png.width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        const a = data[pixelIndex + 3];
        row.push(rgbaToHex(r, g, b, a));
      }
      sprite.push(row);
    }

    return sprite;
  } catch (err) {
    console.warn(`Failed to parse PNG: ${err instanceof Error ? err.message : err}`);
    const sprite = [];
    for (let y = 0; y &lt; height; y++) {
      sprite.push(new Array(width).fill(''));
    }
    return sprite;
  }
}

// Recursively flatten manifest
function flattenManifest(node, inherited) {
  if (node.type === 'asset') {
    const asset = node;
    const orientation = asset.orientation ?? inherited.orientation;
    const state = asset.state ?? inherited.state;
    return [
      {
        id: asset.id,
        name: inherited.name,
        label: inherited.name,
        category: inherited.category,
        file: asset.file,
        width: asset.width,
        height: asset.height,
        footprintW: asset.footprintW,
        footprintH: asset.footprintH,
        isDesk: inherited.category === 'desks',
        canPlaceOnWalls: inherited.canPlaceOnWalls,
        canPlaceOnSurfaces: inherited.canPlaceOnSurfaces,
        backgroundTiles: inherited.backgroundTiles,
        groupId: inherited.groupId,
        ...(orientation ? { orientation } : {}),
        ...(state ? { state } : {}),
        ...(asset.mirrorSide ? { mirrorSide: true } : {}),
        ...(inherited.rotationScheme ? { rotationScheme: inherited.rotationScheme } : {}),
        ...(inherited.animationGroup ? { animationGroup: inherited.animationGroup } : {}),
        ...(asset.frame !== undefined ? { frame: asset.frame } : {}),
      },
    ];
  }

  const group = node;
  const results = [];

  for (const member of group.members) {
    const childProps = { ...inherited };

    if (group.groupType === 'rotation') {
      if (group.rotationScheme) {
        childProps.rotationScheme = group.rotationScheme;
      }
    }

    if (group.groupType === 'state') {
      if (group.orientation) {
        childProps.orientation = group.orientation;
      }
      if (group.state) {
        childProps.state = group.state;
      }
    }

    if (group.groupType === 'animation') {
      const orient = group.orientation ?? inherited.orientation ?? '';
      const state = group.state ?? inherited.state ?? '';
      childProps.animationGroup = `${inherited.groupId}_${orient}_${state}`.toUpperCase();
      if (group.state) {
        childProps.state = group.state;
      }
    }

    if (group.orientation &amp;&amp; !childProps.orientation) {
      childProps.orientation = group.orientation;
    }

    results.push(...flattenManifest(member, childProps));
  }

  return results;
}

// Load all furniture assets
async function loadFurnitureAssets() {
  console.log(`[Mock Asset Generator] Scanning: ${furnitureDir}`);

  if (!fs.existsSync(furnitureDir)) {
    console.log('❌ No furniture directory found');
    return null;
  }

  const entries = fs.readdirSync(furnitureDir, { withFileTypes: true });
  const dirs = entries.filter((e) =&gt; e.isDirectory());

  if (dirs.length === 0) {
    console.log('❌ No furniture subdirectories found');
    return null;
  }

  console.log(`📦 Found ${dirs.length} furniture folders`);

  const catalog = [];
  const sprites = {};

  for (const dir of dirs) {
    console.log(`  Processing: ${dir.name}`);
    const itemDir = path.join(furnitureDir, dir.name);
    const manifestPath = path.join(itemDir, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      console.warn(`    ⚠️  No manifest.json in ${dir.name}`);
      continue;
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      const inherited = {
        groupId: manifest.id,
        name: manifest.name,
        category: manifest.category,
        canPlaceOnWalls: manifest.canPlaceOnWalls,
        canPlaceOnSurfaces: manifest.canPlaceOnSurfaces,
        backgroundTiles: manifest.backgroundTiles,
      };

      let assets;

      if (manifest.type === 'asset') {
        assets = [
          {
            id: manifest.id,
            name: manifest.name,
            label: manifest.name,
            category: manifest.category,
            file: manifest.file ?? `${manifest.id}.png`,
            width: manifest.width,
            height: manifest.height,
            footprintW: manifest.footprintW,
            footprintH: manifest.footprintH,
            isDesk: manifest.category === 'desks',
            canPlaceOnWalls: manifest.canPlaceOnWalls,
            canPlaceOnSurfaces: manifest.canPlaceOnSurfaces,
            backgroundTiles: manifest.backgroundTiles,
            groupId: manifest.id,
          },
        ];
      } else {
        if (manifest.rotationScheme) {
          inherited.rotationScheme = manifest.rotationScheme;
        }
        const rootGroup = {
          type: 'group',
          groupType: manifest.groupType,
          rotationScheme: manifest.rotationScheme,
          members: manifest.members,
        };
        assets = flattenManifest(rootGroup, inherited);
      }

      for (const asset of assets) {
        try {
          const assetPath = path.join(itemDir, asset.file);
          if (!fs.existsSync(assetPath)) {
            console.warn(`    ⚠️  Asset file not found: ${asset.file} in ${dir.name}`);
            continue;
          }

          const pngBuffer = fs.readFileSync(assetPath);
          const spriteData = pngToSpriteData(pngBuffer, asset.width, asset.height);
          sprites[asset.id] = spriteData;
        } catch (err) {
          console.warn(
            `    ⚠️  Error loading ${asset.id}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }

      catalog.push(...assets);
    } catch (err) {
      console.warn(
        `    ⚠️  Error processing ${dir.name}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(`  ✓ Loaded ${Object.keys(sprites).length} / ${catalog.length} assets`);
  console.log(`[Mock Asset Generator] ✅ Successfully loaded ${Object.keys(sprites).length} furniture sprites`);

  return { catalog, sprites };
}

// Main function
async function main() {
  console.log('='.repeat(60));
  console.log('Pixel Agents - Mock Asset Generator');
  console.log('='.repeat(60));
  console.log();

  try {
    const furniture = await loadFurnitureAssets();

    const output = {
      furniture,
      generatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log();
    console.log(`✅ Output written to: ${outputPath}`);
    console.log();
    console.log('='.repeat(60));
    console.log('Done!');
    console.log('='.repeat(60));
  } catch (err) {
    console.error();
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

main();


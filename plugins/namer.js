import { Namer } from "@parcel/plugin";

export default new Namer({
  name({ bundle }) {
    // Check if the bundle is your JS file
    if (bundle.filePath.endsWith(".js")) {
      // Extract the original filename without extension
      const originalFilename = bundle.getMainEntry()?.filePath.split(".").slice(0, -1).join(".");
      return `${originalFilename}.js`; // Maintain the original filename with .js extension
    }

    // Return null for other bundles to let Parcel handle naming by default
    return null;
  },
});
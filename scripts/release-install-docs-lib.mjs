export function assertInstallDocumentation(readme, packageIsPublished) {
  const registryCommand = "npm install --global @rogerchappel/skillscan";
  const sourceCommands = [
    "git clone https://github.com/rogerchappel/skillscan.git",
    "npm install --global ./skillscan",
  ];

  if (packageIsPublished) {
    if (!readme.includes(registryCommand)) {
      throw new Error(`README must document the published package with: ${registryCommand}`);
    }
    return;
  }

  if (!readme.includes("has not been published to npm yet")) {
    throw new Error("README must clearly state that the package is not yet published to npm.");
  }
  for (const command of sourceCommands) {
    if (!readme.includes(command)) {
      throw new Error(`README must document the pre-release source install with: ${command}`);
    }
  }

  const registryCommandPosition = readme.indexOf(registryCommand);
  const futureReleasePosition = readme.indexOf("After the first release");
  if (registryCommandPosition !== -1 &&
      (futureReleasePosition === -1 || registryCommandPosition < futureReleasePosition)) {
    throw new Error("README advertises a registry install before the package has been published.");
  }
}

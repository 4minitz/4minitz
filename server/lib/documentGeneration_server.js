// The /server/lib ensures, that all global functions from here are loaded first
// So any server code can rely on availability of these document helper methods
// We had to move them outside of /import dir to ensure this code is never available
// on the client. Because previously fs-extra stuff was inserted into client code
// and broke loading the app in IE11

import { Meteor } from "meteor/meteor";

const fs = require("fs-extra");
const path = require("path");

createDocumentStoragePath = function (fileObj) {
  //eslint-disable-line
  if (Meteor.isServer) {
    let absoluteDocumentPath = getDocumentStorageRootDirectory(); //eslint-disable-line
    // optionally: append sub directory for parent meeting series and year if a minute is given
    if (fileObj?.meta && fileObj.meta.minuteId) {
      absoluteDocumentPath =
        absoluteDocumentPath + "/" + fileObj.meta.meetingSeriesId;
      let minuteYear = new Date(fileObj.meta.minuteDate).getFullYear();
      absoluteDocumentPath = absoluteDocumentPath + "/" + minuteYear;
    }
    // create target dir for document storage if it does not exist
    fs.ensureDirSync(absoluteDocumentPath, function (err) {
      if (err) {
        console.error(
          "ERROR: Could not create path for protocol storage: " +
            absoluteDocumentPath,
        );
      }
    });
    return absoluteDocumentPath;
  }
};

//This function will delete the DocumentStoragePath with each subdirectory in it
//It is used within the E2E-Tests to reset the app
resetDocumentStorageDirectory = function () {
  //eslint-disable-line
  let storagePath = getDocumentStorageRootDirectory(); //eslint-disable-line
  if (fs.existsSync(storagePath)) {
    fs.emptyDir(storagePath);
  }
};

getDocumentStorageRootDirectory = () => {
  //eslint-disable-line
  let absoluteDocumentPath = Meteor.settings.docGeneration?.targetDocPath
    ? Meteor.settings.docGeneration.targetDocPath
    : "protocols";
  // make path absolute
  if (!path.isAbsolute(absoluteDocumentPath)) {
    absoluteDocumentPath = path.resolve(absoluteDocumentPath);
  }
  return absoluteDocumentPath;
};

convertHTML2PDF = (htmldata, fileName, metaData) => {
  //eslint-disable-line
  let checkFileExists = (filepath, fileNameForErrorMsg) => {
    if (!fs.existsSync(filepath)) {
      throw new Meteor.Error(
        "runtime-error",
        "Error at PDF generation: " +
          fileNameForErrorMsg +
          " not found at: " +
          filepath,
      );
    }
  };
  checkFileExists(
    Meteor.settings.docGeneration.pathToWkhtmltopdf,
    "Binary wkhtmltopdf",
  );

  //Safe file as html
  const tempFileName =
    getDocumentStorageRootDirectory() + "/TemporaryProtocol.html"; //eslint-disable-line
  fs.outputFileSync(tempFileName, htmldata);

  //Safe file as pdf
  const exec = require("child_process").execSync;
  let exePath = '"' + Meteor.settings.docGeneration.pathToWkhtmltopdf + '"';
  let outputPath = getDocumentStorageRootDirectory() + "/TemporaryProtocol.pdf"; //eslint-disable-line

  let additionalArguments = "";
  if (
    Meteor.settings.docGeneration.wkhtmltopdfParameters &&
    Meteor.settings.docGeneration.wkhtmltopdfParameters !== ""
  ) {
    additionalArguments =
      " " + Meteor.settings.docGeneration.wkhtmltopdfParameters.trim();
  }

  exec(
    exePath +
      additionalArguments +
      ' "' +
      tempFileName +
      '" "' +
      outputPath +
      '"',
    {
      stdio: "ignore", //surpress progess messages from pdf generation in server console
    },
  );

  //Safe file as pdf-a
  if (Meteor.settings.public.docGeneration.format === "pdfa") {
    checkFileExists(
      Meteor.settings.docGeneration.pathToGhostscript,
      "Binary ghostscript",
    );
    checkFileExists(
      Meteor.settings.docGeneration.pathToPDFADefinitionFile,
      "PDFA definition file",
    );

    exePath = '"' + Meteor.settings.docGeneration.pathToGhostscript + '"';
    let icctype = Meteor.settings.docGeneration.ICCProfileType.toUpperCase();
    let inputPath = outputPath;
    outputPath = getDocumentStorageRootDirectory() + "/TemporaryProtocol-A.pdf"; //eslint-disable-line
    additionalArguments =
      " -dPDFA=2 -dBATCH -dNOPAUSE -dNOOUTERSAVE" +
      " -dColorConversionStrategy=/" +
      icctype +
      " -sProcessColorModel=Device" +
      icctype +
      " -sDEVICE=pdfwrite -dPDFACompatibilityPolicy=1 -sOutputFile=";

    try {
      exec(
        exePath +
          additionalArguments +
          '"' +
          outputPath +
          '" "' +
          Meteor.settings.docGeneration.pathToPDFADefinitionFile +
          '" "' +
          inputPath +
          '"',
        {
          stdio: "ignore", //surpress progess messages from pdf generation in server console
        },
      );
    } catch (error) {
      throw new Meteor.Error(
        "runtime-error",
        "Unknown error at PDF generation. Could not execute ghostscript properly.",
      );
    }

    fs.unlink(inputPath);
  }
  fs.unlink(tempFileName);
  // Now move file to it's meetingseries directory
  let finalPDFOutputPath =
    createDocumentStoragePath({ meta: metaData }) + "/" + Random.id() + ".pdf"; //eslint-disable-line
  fs.moveSync(outputPath, finalPDFOutputPath);

  return finalPDFOutputPath;
};

// check storagePath for protocols once at server bootstrapping
// also check necessary binaries for pdf generation
if (Meteor.settings.docGeneration?.enabled) {
  console.log("Document generation feature: ENABLED");
  let settingsPath = createDocumentStoragePath(undefined); //eslint-disable-line
  let absoluteTargetPath = path.resolve(settingsPath);
  console.log("Document Storage Path: " + absoluteTargetPath);

  fs.access(absoluteTargetPath, fs.W_OK, function (err) {
    if (err) {
      console.error("*** ERROR*** No write access to Document Storage Path");
      console.error("             Documents can not be saved.");
      console.error(
        "             Ensure write access to path specified in your settings.json",
      );
      console.error(
        "             Current Document Storage Path setting is: " +
          absoluteTargetPath,
      );
      // Now switch off feature!
      Meteor.settings.docGeneration.enabled = false;
      console.log("Document generation feature: DISABLED");
    } else {
      console.log("OK, has write access to Document Storage Path");
      //Check pdf binaries
      if (
        Meteor.settings.docGeneration.format === "pdf" ||
        Meteor.settings.docGeneration.format === "pdfa"
      ) {
        checkCondition(
          Meteor.settings.docGeneration.pathToWkhtmltopdf,
          "No path for wkhtmltopdf is assigned within settings.json.",
        );
        checkFileExists(
          Meteor.settings.docGeneration.pathToWkhtmltopdf,
          "binary for wkhtmltopdf",
        );
        if (Meteor.settings.docGeneration.format === "pdfa") {
          checkCondition(
            Meteor.settings.docGeneration.pathToGhostscript,
            "No path for ghostscript is assigned within settings.json.",
          );
          checkFileExists(
            Meteor.settings.docGeneration.pathToGhostscript,
            "binary for ghostscript",
          );
          checkCondition(
            Meteor.settings.docGeneration.pathToPDFADefinitionFile &&
              (Meteor.settings.docGeneration.ICCProfileType === "rgb" ||
                Meteor.settings.docGeneration.ICCProfileType === "cmyk"),
            "Both a path to a pdfa definition file and a valid ICC profile type have to be assigned in the settings.json",
          );
          checkFileExists(
            Meteor.settings.docGeneration.pathToPDFADefinitionFile,
            "PDFA definition file",
          );
        }
      }
    }
  });
} else {
  console.log("Document generation feature: DISABLED");
}

let checkCondition = (condition, errorMessage) => {
  if (Meteor.settings.docGeneration.enabled) {
    if (!condition) {
      console.error("*** ERROR*** " + errorMessage);
      console.error("             Document generation feature: DISABLED");
      Meteor.settings.docGeneration.enabled = false;
    }
  }
};

let checkFileExists = (filepath, filename) => {
  checkCondition(
    fs.existsSync(filepath),
    "Missing " + filename + " at path: " + filepath,
  );
};

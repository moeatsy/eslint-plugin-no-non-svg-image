module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow usage of next/image with non-SVG images",
      category: "Best Practices",
      recommended: false,
    },
    messages: {
      noNonSvgImages:
          "Using next/image with non-SVG images is not allowed. Only SVGs are allowed.",
    },
    schema: [],
  },

  create(context) {
    const importedImages = new Map();

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        if (source && /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(source)) {
          node.specifiers.forEach((specifier) => {
            if (specifier.type === "ImportDefaultSpecifier") {
              // Store the import path with the imported variable name
              importedImages.set(specifier.local.name, source);
            }
          });
        }
      },

      JSXOpeningElement(node) {
        if (node.name.name === "Image" || node.name.name === "NextImage") {
          const srcAttribute = node.attributes.find(
              (attr) => attr.name && attr.name.name === "src"
          );

          if (srcAttribute) {
            let srcValue;

            if (srcAttribute.value.type === "Literal") {
              srcValue = srcAttribute.value.value;
            }

            else if (srcAttribute.value.type === "JSXExpressionContainer") {
              const expression = srcAttribute.value.expression;

              if (
                  expression.type === "MemberExpression" &&
                  expression.object &&
                  expression.object.type === "Identifier" &&
                  importedImages.has(expression.object.name) &&
                  expression.property.name === "src"
              ) {
                const imagePath = importedImages.get(expression.object.name);
                srcValue = `${imagePath}`; // Resolve to the image path
              }

              else if (
                  expression.type === "Identifier" &&
                  importedImages.has(expression.name)
              ) {
                srcValue = importedImages.get(expression.name);
              }
            }

            if (srcValue) {
              const imageExtensions = /\.(svg)$/i;
              if (!imageExtensions.test(srcValue)) {
                context.report({
                  node,
                  messageId: "noNonSvgImages",
                });
              }
            }
          }
        }
      },
    };
  },
};

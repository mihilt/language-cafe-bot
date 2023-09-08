// eslint-disable-next-line import/prefer-default-export
export const checkMaxContentLength = ({ length, content, additionalContent }) => {
  if (content.length > length) {
    return `The message is too long.${additionalContent || ''}`;
  }

  return content;
};

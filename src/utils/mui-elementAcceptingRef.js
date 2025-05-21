import PropTypes from 'prop-types';

const chainPropTypes = (propType1, propType2) => {
  return function validate(...args) {
    const error1 = propType1(...args);
    if (error1) return error1;
    return propType2(...args);
  };
};

function isClassComponent(elementType) {
  const {
    prototype = {}
  } = elementType;
  return Boolean(prototype.isReactComponent);
}

function acceptingRef(props, propName, componentName, location, propFullName) {
  const element = props[propName];
  const safePropName = propFullName || propName;
  if (element == null ||
  typeof window === 'undefined') {
    return null;
  }
  let warningHint;
  const elementType = element.type;
  if (typeof elementType === 'function' && !isClassComponent(elementType)) {
    warningHint = 'Did you accidentally use a plain function component for an element instead?';
  }
  if (warningHint !== undefined) {
    return new Error(`Invalid ${location} \`${safePropName}\` supplied to \`${componentName}\`. ` + `Expected an element that can hold a ref. ${warningHint} ` + 'For more information see https://mui.com/r/caveat-with-refs-guide');
  }
  return null;
}

const elementAcceptingRef = chainPropTypes(PropTypes.element, acceptingRef);
elementAcceptingRef.isRequired = chainPropTypes(PropTypes.element.isRequired, acceptingRef);

export default elementAcceptingRef; 
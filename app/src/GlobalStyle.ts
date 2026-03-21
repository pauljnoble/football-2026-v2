import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    margin: 0;
  }

  :root {
    --font-family-default: "ASAP Condensed", georgia, serif;
    --color-background: #0c0d10;
    --canvas-top: 60px;
  }

  body {
    font-family: var(--font-family-default);
    background: #0c0d10;
    color: #e8e6ed;
  }
`;

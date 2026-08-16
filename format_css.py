import re
import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    css_block = """
  // ─── STYLES ───────────────────────────────────────────
  const customStyles = `
    .pst-wrapper {
      padding: 24px;
      max-width: 1536px;
      margin: 10px auto;
      font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif !important;
      color: var(--color-text-primary, #111827);
      background-color: var(--color-bg-page, #F5F6FA) !important;
      min-height: calc(100vh - 60px);
    }
    @media(max-width: 1024px) { .pst-wrapper { padding: 16px; margin: 6px auto; } }
    @media(max-width: 768px) { .pst-wrapper { padding: 12px; margin: 4px auto; } }

    /* Typography */
    .pst-wrapper h2 { font-size: 28px !important; font-weight: 600 !important; color: #111827 !important; margin: 0 0 24px 0 !important; line-height: 1.3 !important; }
    .pst-wrapper h3, .pst-wrapper h4 { font-size: 18px !important; font-weight: 600 !important; color: #111827 !important; margin: 0 0 16px 0 !important; line-height: 1.3 !important; }
    .pst-wrapper p { font-size: 16px !important; font-weight: 400 !important; color: #6B7280 !important; line-height: 1.5 !important; }
    .pst-wrapper label { font-size: 14px !important; font-weight: 500 !important; text-transform: uppercase; letter-spacing: 0.03em; color: #9CA3AF !important; }

    /* Cards */
    .pst-card {
      background: #FFFFFF !important;
      border-radius: 10px !important;
      border: 1px solid #E5E7EB !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
      padding: 24px !important;
      transition: all 150ms ease-in-out !important;
      margin-bottom: 24px !important;
    }
    .pst-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
      transform: translateY(-1px) !important;
    }

    /* Buttons */
    .pst-wrapper button {
      border-radius: 8px !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      transition: all 150ms ease-in-out !important;
      cursor: pointer !important;
    }
    .pst-wrapper button:hover:not(:disabled) {
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
    }
    .pst-wrapper button:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }

    /* Specific button overrides */
    .pst-btn-gold { background: #D97706 !important; color: white !important; }
    .pst-wrapper button[style*="background"]:hover:not(:disabled) {
      /* Apply gold hover to buttons with inline backgrounds like #f1f5f9 or others if they aren't primary blue */
      background: #D97706 !important;
      color: white !important;
    }
    /* Exclude primary and danger buttons from turning gold on hover if we can */
    .pst-wrapper button[style*="#3b82f6"]:hover:not(:disabled),
    .pst-wrapper button[style*="2563eb"]:hover:not(:disabled) {
      background: #1D4ED8 !important;
      color: white !important;
    }
    .pst-wrapper button[style*="#ef4444"]:hover:not(:disabled),
    .pst-wrapper button[style*="dc2626"]:hover:not(:disabled) {
      background: #DC2626 !important;
      color: white !important;
    }

    /* Tables */
    .pst-wrapper table { border-collapse: collapse !important; font-size: 14px !important; width: 100% !important; min-width: 700px !important; }
    .pst-wrapper th { background: #F9FAFB !important; text-transform: uppercase !important; font-size: 14px !important; font-weight: 500 !important; letter-spacing: 0.03em; color: #9CA3AF !important; padding: 12px 16px !important; border-bottom: 1px solid #E5E7EB !important; text-align: left !important; }
    .pst-wrapper td { padding: 12px 16px !important; border-bottom: 1px solid #E5E7EB !important; color: #111827 !important; }
    .pst-wrapper tr { transition: background 150ms ease-in-out !important; }
    .pst-wrapper tr:hover td { background: #F9FAFB !important; }

    /* Inputs */
    .pst-wrapper input, .pst-wrapper select, .pst-wrapper textarea {
      height: 36px !important;
      border-radius: 8px !important;
      border: 1px solid #E5E7EB !important;
      padding: 0 12px !important;
      font-size: 14px !important;
      transition: all 150ms ease !important;
      box-sizing: border-box !important;
    }
    .pst-wrapper input:focus, .pst-wrapper select:focus, .pst-wrapper textarea:focus {
      outline: none !important; border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,.1) !important;
    }

    /* Segmented Spinner */
    .segmented-spinner {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 4px solid transparent;
      border-top-color: #2563EB;
      border-right-color: #2563EB;
      border-bottom-color: #E5E7EB;
      border-left-color: #E5E7EB;
      animation: spin 1s infinite cubic-bezier(0.5, 0, 0.5, 1);
      margin: 48px auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;
"""

    if "const customStyles =" not in content:
        content = content.replace("const PurchaseSmartTenders = () => {\n", "const PurchaseSmartTenders = () => {\n" + css_block)
        
        # Inject the wrapper
        content = re.sub(r'return\s*\(\s*<div', r'return (\n    <div className="pst-wrapper">\n      <style>{customStyles}</style>\n      <div', content, count=1)
        # Close the wrapper
        content = re.sub(r'(\s*)</div>\s*\);\s*};\s*export default', r'\1</div>\n\1</div>\n  );\n};\n\nexport default', content)

    # Convert common card styles
    content = re.sub(r'<div style=\{\{[^}]*background:\s*\'white\'[^}]*borderRadius:\s*\'(?:12px|14px|10px)\'[^}]*boxShadow:[^}]*\}\}>', r'<div className="pst-card">', content)
    content = re.sub(r'<div style=\{\{[^}]*background:\s*\'white\'[^}]*boxShadow:[^}]*borderRadius:\s*\'(?:12px|14px|10px)\'[^}]*\}\}>', r'<div className="pst-card">', content)

    # Convert Spinners
    content = re.sub(r'<div style=\{\{[^}]*\}\}>\s*(?:⏳\s*)?(?:Loading|Loading...)[^<]*</div>', r'<div className="segmented-spinner"></div>', content)

    # Remove zebra striping logic from tr (borderBottom logic usually, or bg color)
    # The CSS takes care of hover state anyway.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Successfully processed " + filepath)

if __name__ == "__main__":
    process_file(sys.argv[1])

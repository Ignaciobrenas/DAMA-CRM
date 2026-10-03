import re

with open('C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/client/src/pages/Login.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <form with <motion.form
# Replace </form> with </motion.form>
# Wait, they have className="... animate-in fade-in duration-200" or similar. We should replace that with framer-motion props.

# We will just replace all `<form` with `<motion.form`
content = content.replace('<form', '<motion.form\n            initial={{ opacity: 0, scale: 0.96, y: 8 }}\n            animate={{ opacity: 1, scale: 1, y: 0 }}\n            exit={{ opacity: 0, scale: 0.96, y: 8 }}\n            transition={{ type: "spring", stiffness: 450, damping: 30 }}')
content = content.replace('</form>', '</motion.form>')

# We also need to wrap the whole forms area with <AnimatePresence mode="wait">
# Let's find the start of Form 1: Login
# and the end of Form 5: 2FA OTP

parts = content.split("{/* Form 1: Login */}")
if len(parts) == 2:
    start_half = parts[0]
    forms_half = parts[1]
    
    parts2 = forms_half.split("{/* External Footer Links */}")
    forms_only = parts2[0]
    footer_only = parts2[1]
    
    # Wrap forms_only with AnimatePresence
    new_forms_only = f"<AnimatePresence mode=\"wait\">\n          {{/* Form 1: Login */}}{forms_only}        </AnimatePresence>\n\n        {{/* External Footer Links */}}"
    
    new_content = start_half + new_forms_only + footer_only
    
    # Remove old animate-in classes
    new_content = new_content.replace(' animate-in fade-in duration-200', '')
    
    # Add key prop to each motion.form to make AnimatePresence work
    # We can use regex to inject key={mode}
    new_content = re.sub(r'<motion\.form', r'<motion.form key={mode}', new_content)
    
    with open('C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/client/src/pages/Login.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)

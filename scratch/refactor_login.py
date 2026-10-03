import re

with open('C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/client/src/pages/Login.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add noValidate to forms
content = re.sub(r'<form onSubmit=\{([^}]+)\} className="([^"]+)">', r'<form onSubmit={\1} className="\2" noValidate>', content)

# 2. Email input in Login
# We have to be careful with replace. Let's find specific blocks.

content = content.replace(
"""                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="admin@dama-crm.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>""",
"""                <ValidatedInput
                  type="email"
                  required
                  placeholder="admin@dama-crm.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  validator={validateEmail}
                />"""
)

content = content.replace(
"""                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>""",
"""                <ValidatedInput
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  validator={(val) => validateRequired(val, 'La contraseña', 6)}
                />"""
)

# Email in Forgot Password
content = content.replace(
"""                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>""",
"""                <ValidatedInput
                  type="email"
                  required
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  validator={validateEmail}
                />"""
)

# 2FA OTP
content = content.replace(
"""              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />""",
"""              <ValidatedInput
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="text-center tracking-widest text-lg font-mono"
                validator={(val) => validateNumber(val, { min: 0, max: 999999, fieldName: 'El código' })}
                showSuccessBadge={false}
              />"""
)

# New password in Reset Password
content = content.replace(
"""              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>""",
"""              <ValidatedInput
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                validator={(val) => {
                  const res = checkPasswordStrength(val);
                  return { isValid: res.isValid, message: 'La contraseña es muy débil (mínimo 8 caracteres, números y letras)' };
                }}
              />"""
)

# Confirm password
content = content.replace(
"""              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>""",
"""              <ValidatedInput
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                validator={(val) => ({
                  isValid: val === newPassword,
                  message: 'Las contraseñas no coinciden'
                })}
              />"""
)

# Recover code
content = content.replace(
"""              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono tracking-widest bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
              </div>""",
"""              <ValidatedInput
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
                className="font-mono tracking-widest text-center"
                validator={(val) => validateNumber(val, { min: 0, max: 999999, fieldName: 'El código' })}
              />"""
)


with open('C:/Users/Ignacio/Desktop/Proyectos/DAMA-CRM/client/src/pages/Login.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

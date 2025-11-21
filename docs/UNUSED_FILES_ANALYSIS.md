# Unused Files and Folders Analysis

## ✅ **Files/Folders That Can Be Safely Deleted**

### 1. **Root Level**
- `math4code.zip` (322KB) - Archive file, not needed in source code
- `pnpm-lock.yaml` - If using npm (you have package-lock.json), this is redundant

### 2. **App Directory - Unused Routes**

#### `/app/pay/page.tsx`
- **Status**: Likely unused
- **Reason**: You have `/app/student/payment/` for payment handling
- **Action**: Can be deleted if not referenced

#### `/app/success/page.tsx`
- **Status**: Likely unused  
- **Reason**: You have `/app/student/payment/success/` for payment success
- **Action**: Can be deleted if not referenced

#### `/app/upload/page.tsx`
- **Status**: Potentially unused
- **Reason**: Check if this is used for PDF uploads or if you have another upload mechanism
- **Action**: Review before deleting

#### `/app/dashboard/` (entire folder)
- **Status**: **KEEP** - This is used as a router
- **Reason**: Routes to admin/student dashboard based on role
- **Action**: Keep this - it's the main entry point

### 3. **API Routes to Check**

#### `/app/api/upload-pdf/route.ts`
- **Status**: Check usage
- **Reason**: Verify if this is actively used for PDF uploads
- **Files to check**: Look for fetch calls to `/api/upload-pdf`

## 📋 **Recommended Actions**

### **Safe to Delete (Low Risk)**
```
✓ math4code.zip
✓ pnpm-lock.yaml (if using npm)
✓ app/pay/page.tsx
✓ app/success/page.tsx
```

### **Review Before Deleting (Medium Risk)**
```
? app/upload/page.tsx
? app/api/upload-pdf/route.ts
```

### **Keep (Essential)**
```
✓ app/dashboard/ - Main router
✓ All admin/ folders
✓ All student/ folders
✓ All hooks/
✓ All components/
✓ All lib/
```

## 🔍 **How to Verify Usage**

### Check if a file is imported anywhere:
```bash
# Search for imports of a specific file
grep -r "from.*pay" app/
grep -r "from.*success" app/
grep -r "from.*upload" app/
```

### Check API route usage:
```bash
# Search for API calls
grep -r "api/upload-pdf" app/
grep -r "/pay" app/
```

## 📊 **Space Savings**

If you delete the recommended files:
- `math4code.zip`: ~322 KB
- `pnpm-lock.yaml`: ~176 KB
- `app/pay/page.tsx`: ~1 KB
- `app/success/page.tsx`: ~1.5 KB
- `app/upload/page.tsx`: ~2 KB

**Total**: ~502 KB

## ⚠️ **Important Notes**

1. **Always backup** before deleting
2. **Test thoroughly** after deletion
3. **Check git history** to see if files were recently used
4. **Search codebase** for any references before deleting

## 🎯 **Next Steps**

1. Run searches to verify no imports
2. Check git log for recent usage
3. Delete safe files first
4. Test application
5. Delete medium-risk files if confirmed unused
6. Commit changes

---

**Generated**: 2025-11-21
**Project**: math4code-authv2

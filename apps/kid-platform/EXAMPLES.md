# 使用範例

## i18n 字串系統

```tsx
import { useI18n } from '@/lib/i18n';

function WelcomePage() {
  const { t } = useI18n();
  
  return (
    <div>
      <Typography tag="h1" variant="title" size="2xl">
        {t('student.welcome.title')}
      </Typography>
      <Typography tag="p" variant="subtitle">
        {t('student.welcome.subtitle')}
      </Typography>
      <BigButton>
        {t('student.welcome.startButton')}
      </BigButton>
    </div>
  );
}
```

## Typography 元件

```tsx
import { Typography } from '@/components/ui/typography';

// 基礎使用
<Typography tag="h1" variant="title" size="2xl" weight="bold">
  標題
</Typography>

// 鮮豔顏色（小朋友專用）
<Typography tag="h1" variant="title" size="2xl" colorful>
  歡迎回來！
</Typography>
```

## Kid-Friendly 元件

```tsx
import { BigButton } from '@/components/kid-friendly/BigButton';
import { KidTypography } from '@/components/kid-friendly/KidTypography';
import { BookOpen } from 'lucide-react';

// 大按鈕
<BigButton 
  variant="primary" 
  size="lg"
  icon={BookOpen}
  iconPosition="left"
>
  開始學習
</BigButton>

// 小朋友專用文字
<KidTypography tag="h1" size="3xl" colorful>
  今天學什麼？
</KidTypography>
```

## 表單驗證

```tsx
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { studentProfileSchema } from '@/lib/validations/forms';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BigButton } from '@/components/kid-friendly/BigButton';

function ProfileForm() {
  const form = useForm({
    resolver: yupResolver(studentProfileSchema),
    defaultValues: studentProfileSchema.getDefault(),
  });

  const onSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="你的名字" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <BigButton type="submit">儲存</BigButton>
      </form>
    </Form>
  );
}
```

## 專家修改字串

所有字串都在 `src/lib/i18n/strings/` 目錄下：

- `common.ts` - 通用字串（按鈕、狀態訊息等）
- `student.ts` - 小朋友相關字串
- `teacher.ts` - 老師相關字串
- `coach.ts` - 教練相關字串

專家可以直接修改這些檔案，不需要改程式碼。

例如修改歡迎訊息：
```typescript
// src/lib/i18n/strings/student.ts
export const studentStrings = {
  welcome: {
    title: '歡迎回來！',  // 改成任何你想要的文字
    // ...
  },
};
```

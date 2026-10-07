# Implementation plan - Website thiep cuoi tinh tren mobile

## Muc tieu

Dung mot website tinh chay truc tiep tren browser dien thoai, uu tien trai nghiem tren iPhone 16, va van responsive tren cac man hinh mobile khac. Toan bo giao dien phai bam sat design co san trong `D:\AI\thiep online`; khong tu y doi layout, mau sac, typography, hinh anh, border, background hay thu tu section.

## Nguyen tac bam design

1. `ALL.png` / `main page.png` la ban tong the de doi chieu thu tu, ty le va tong cam giac cua trang.
2. `background.png` la nen chinh cua trang, dung lam layer nen full page theo ty le goc `2331 x 14892`.
3. Cac file `section 1.png` den `section 4.png` se duoc dat theo dung thu tu tang dan. Hien tai thu muc asset chua thay `section 5.png` va `section 6.png`, nen can xac nhan bo sung neu design tong the that su co 6 section rieng.
4. Album anh dung `anh 1.png` den `anh 6.png`, nam trong khung `frame.png`. Khung giu nguyen kich thuoc/tinh chat design, anh chay ben trong duoc crop/can theo vung anh cua frame.
5. `nut xac nhan tham du.png` se duoc dung nguyen asset, khong dung button CSS ve lai.
6. Moi kich thuoc hien thi nen tinh theo ty le goc, dung `max-width`, `aspect-ratio`, `object-fit`, `clamp()` va container mobile thay vi hard-code tuy tien.

## Asset inventory da kiem tra

- `ALL.png`: `2331 x 14892`
- `main page.png`: `2331 x 14892`
- `background.png`: `2331 x 14892`
- `section 1.png`: `890 x 1011`
- `section 2.png`: `877 x 1289`
- `section 3.png`: `913 x 971`
- `section 4.png`: `999 x 1255`
- `frame.png`: `880 x 1248`
- `anh 1.png` - `anh 6.png`: khoang `784/785 x 1153`
- `anh chay.png`: `880 x 1248`, co the la mockup/reference cho album trong frame
- `nut xac nhan tham du.png`: `639 x 120`

## Kien truc file de xuat

Giu site tinh, de mo truc tiep bang browser hoac host tren bat ky static hosting nao:

```text
D:\AI\invitation-card\
  index.html
  assets\
    ALL.png                  # chi dung de doi chieu, khong nhat thiet render
    main-page.png            # chi dung de doi chieu neu can
    background.png
    frame.png
    album-1.png ... album-6.png
    album-reference.png
    rsvp-button.png
    section-1.png ... section-4.png
  styles\
    main.css
  scripts\
    main.js
  IMPLEMENTATION_PLAN.md
```

Neu muon giu ten file tieng Viet goc cung duoc, nhung khi lam web nen copy sang `assets/` voi ten ASCII de tranh loi duong dan tren mot so host/browser.

## Layout va thu tu section

1. Page wrapper can giua man hinh, mobile-first.
2. Nen `background.png` dat lam layer tuyet doi/phu theo chieu doc trang, width 100%, giu ti le theo design tong the.
3. Content layer dat tren nen, gom lan luot:
   - Section 1
   - Section 2
   - Section 3
   - Album anh chay trong `frame.png`
   - Section 4
   - Nut xac nhan tham du neu trong design tong the dat o cuoi hoac tai vi tri theo `ALL.png`
   - Section 5/6 neu duoc bo sung
4. Vi `ALL.png` la design tong the cao `14892px`, can can lai toa do section theo anh tong the khi implement: dung screenshot/reference overlay de tinh margin-top, width va alignment.

## Responsive strategy

- Chuan thiet ke: xem tren iPhone 16, viewport tham chieu `393 x 852 CSS px` hoac gan tuong duong.
- `body` nen co background phu ngoai trang, phan invitation giu `max-width` khoang `430px` hoac theo canvas mobile dep nhat.
- Moi section anh: `width: min(100%, <ty-le-thiet-ke>)`, `height: auto`, `display: block`.
- Khong scale bang viewport width qua muc lam vo design; dung container trung tam va section theo phan tram cua container.
- Test cac kich thuoc toi thieu:
  - 360 x 780
  - 375 x 812
  - 390 x 844
  - 393 x 852 (iPhone 16)
  - 430 x 932
  - 768 x 1024 de dam bao tablet khong bi phong qua xau

## Album anh chay

Phuong an de xuat:

1. Tao component `.album-frame` co `position: relative`, kich thuoc theo `frame.png`.
2. Dat slideshow anh cuoi ben duoi frame, o vung long khung, dung `object-fit: cover`.
3. Dat `frame.png` len tren cung bang `<img class="album-frame-overlay">` de border bao quanh anh.
4. Chuyen anh bang CSS animation hoac JS nhe:
   - auto slide moi 2.5-3.5 giay
   - fade hoac translate nhe, khong them effect lam lech design
   - ho tro touch swipe neu can, nhung khong bat buoc neu design chi yeu cau anh chay
5. Ton trong `prefers-reduced-motion`: neu nguoi xem tat motion thi dung fade cham hoac hien anh dau tien.

## Nut xac nhan tham du

- Render bang asset `nut xac nhan tham du.png`.
- Boc trong `<a>` de co the gan link RSVP sau nay.
- Neu chua co link RSVP, co the de `href="#"` tam thoi hoac scroll toi khu vuc xac nhan neu co section tuong ung.
- Can xac nhan hanh dong mong muon: mo Google Form, goi dien, nhan tin Zalo, hay chi la nut trang tri trong design.

## Cac diem can xac nhan voi ban

1. Thu muc asset hien chi co `section 1.png` den `section 4.png`; ban co `section 5.png` va `section 6.png` khong, hay `ALL.png`/`main page.png` moi la 6 phan con?
2. Nut `xac nhan tham du` can bam vao dau: Google Form, Zalo, so dien thoai, hay popup/section RSVP trong trang?
3. Album anh chay nam chinh xac sau section nao theo design tong the: sau section 3 hay vi tri khac trong `ALL.png`?
4. Co can nhac nen/audio khong? Neu co thi can co control bat/tat ro rang vi browser mobile khong cho autoplay audio co tieng.

## Implementation steps

1. Backup/kiem tra site hien co trong `D:\AI\invitation-card` de tranh ghi de nham file dang dung.
2. Copy va chuan hoa asset tu `D:\AI\thiep online` sang `D:\AI\invitation-card\assets`.
3. Tao/cap nhat `index.html` voi semantic structure don gian: wrapper, cac section image, album, RSVP link.
4. Tao/cap nhat `styles/main.css`:
   - mobile-first
   - background layer theo design
   - section sizing theo ty le goc
   - spacing/margin tinh tu `ALL.png`
   - chong horizontal scroll
   - safe-area padding cho iPhone
5. Tao/cap nhat `scripts/main.js` cho slideshow album nhe, khong them framework.
6. Visual QA:
   - mo local HTML/browser
   - chup screenshot viewport iPhone 16
   - doi chieu voi `ALL.png`/`main page.png`
   - sua spacing/scale neu lech
7. Responsive QA tren cac viewport mobile/tablet da liet ke.
8. Final cleanup: chi giu file can thiet, dam bao duong dan asset dung, site chay khi mo `index.html` truc tiep.

## Acceptance criteria

- Trang mo duoc tren browser mobile ma khong can backend.
- Thu tu section khop design tong the.
- Background, section PNG, frame album va nut RSVP giu nguyen design goc.
- Khong co horizontal scroll ngoai y muon.
- Album anh chay trong khung, khong tran ra ngoai border.
- Hien thi tot tren iPhone 16 va cac viewport mobile pho bien.
- Khong co thay doi my thuat tu y ngoai cac thao tac can thiet de responsive.

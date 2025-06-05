const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// すべてのBookInstanceのリストを表示
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});

// 特定のBookInstanceの詳細ページを表示
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // 結果なし
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Book:",
    bookinstance: bookInstance,
  });
});

// BookInstance作成フォームをGETで表示
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

  res.render("bookinstance_form", {
    title: "Create BookInstance",
    book_list: allBooks,
  });
});

// BookInstance作成をPOSTで処理
exports.bookinstance_create_post = [
  // フィールドのバリデーションとサニタイズ
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // バリデーションとサニタイズ後にリクエストを処理
  asyncHandler(async (req, res, next) => {
    // リクエストからバリデーションエラーを抽出
    const errors = validationResult(req);

    // エスケープ・トリム済みデータでBookInstanceオブジェクトを作成
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // エラーがある場合
      // サニタイズ済み値とエラーメッセージでフォームを再表示
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // フォームデータが有効
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// BookInstance削除フォームをGETで表示
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // 結果なし
    res.redirect("/catalog/bookinstances");
  }

  res.render("bookinstance_delete", {
    title: "Delete BookInstance",
    bookinstance: bookInstance,
  });
});

// BookInstance削除をPOSTで処理
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  // 有効なBookInstance idがあると仮定
  await BookInstance.findByIdAndDelete(req.body.id);
  res.redirect("/catalog/bookinstances");
});

// BookInstance更新フォームをGETで表示
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  // フォーム用にbookと全booksを並行取得
  const [bookInstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).populate("book").exec(),
    Book.find(),
  ]);

  if (bookInstance === null) {
    // 結果なし
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_form", {
    title: "Update BookInstance",
    book_list: allBooks,
    selected_book: bookInstance.book._id,
    bookinstance: bookInstance,
  });
});

// BookInstance更新をPOSTで処理
exports.bookinstance_update_post = [
  // フィールドのバリデーションとサニタイズ
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // バリデーションとサニタイズ後にリクエストを処理
  asyncHandler(async (req, res, next) => {
    // リクエストからバリデーションエラーを抽出
    const errors = validationResult(req);

    // エスケープ・トリム済みデータと現在のidでBookInstanceオブジェクトを作成
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // エラーがある場合
      // サニタイズ済み値とエラーでフォームを再表示

      const allBooks = await Book.find({}, "title").exec();

      res.render("bookinstance_form", {
        title: "Update BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // フォームデータが有効
      await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
      // 詳細ページにリダイレクト
      res.redirect(bookInstance.url);
    }
  }),
];

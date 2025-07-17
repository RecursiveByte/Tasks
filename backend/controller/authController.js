import bcrypt from 'bcryptjs';
import connectToDatabase from "../config/db.js";
import jwt from 'jsonwebtoken';

const connection = await connectToDatabase();

export const finalData = async (req, res) => {
  try {
    const [rows] = await connection.execute(`
      SELECT 
        books.id AS book_id,
        books.title,
        books.author,
        books.year,
        books.availability,
        reviews.id AS review_id,
        reviews.user_id,
        reviews.rating,
        reviews.comment
      FROM books
      LEFT JOIN reviews ON books.id = reviews.book_id
    `);

    const groupedBooks = {};

    for (let row of rows) {
      const {
        book_id,
        title,
        author,
        year,
        availability,
        review_id,
        user_id,
        rating,
        comment
      } = row;

      if (!groupedBooks[book_id]) {
        groupedBooks[book_id] = {
          book_id,
          title,
          author,
          year,
          availability,
          reviews: []
        };
      }

      if (review_id) {
        groupedBooks[book_id].reviews.push({
          review_id,
          user_id,
          rating,
          comment
        });
      }
    }

    const booksArray = Object.values(groupedBooks);

    res.status(200).json({ books: booksArray });
  } catch (error) {
    console.error('Error fetching books with reviews:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getBooksWithReviews = async (req, res) => {
  try {
    const [result] = await connection.execute(`
      SELECT 
        books.id AS book_id,
        books.title,
        books.author,
        books.year,
        books.availability,
        reviews.id AS review_id,
        reviews.user_id,
        reviews.rating,
        reviews.comment
      FROM books
      LEFT JOIN reviews ON books.id = reviews.book_id
    `);

    res.status(200).json({ data: result });
  } catch (error) {
    console.error('Error fetching joined book and review data:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


export const getBooksAndReviews = async (req, res) => {
  try {
    const [books] = await connection.execute('SELECT * FROM books');

    const [reviews] = await connection.execute('SELECT * FROM reviews');

    res.status(200).json({
      books,
      reviews
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


export const getAverageRatings = async (req, res) => {
  try {
    const [results] = await connection.execute(`
      SELECT 
        book_id,
        AVG(rating) AS average_rating,
        COUNT(*) AS total_reviews
      FROM reviews
      GROUP BY book_id;
    `);

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error fetching average ratings:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const [existingUser] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length)
      return res.status(409).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const finalRole = role === 'admin' || role === 'user' ? role : 'user';

    await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, finalRole]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const login = async (req, res) => {

  const { email, password, role } = req.body;

  if (!email || !password || !role)
    return res.status(400).json({ message: 'Email, password, and role are required' });

  if (role !== 'admin' && role !== 'user')
    return res.status(400).json({ message: 'Invalid role provided' });

  try {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email, role]
    );

    if (!rows.length)
      return res.status(404).json({ message: `No ${role} found with this email` });

    const user = rows[0];

    console.log(user)

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
        { id: user.id,role:user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
        maxAge: 24 * 60 * 60 * 1000
      });
      

    res.status(200).json({
      message: `${role} login successful`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


//for Users
export const addReview = async (req, res) => {
  const user_id = req.user?.id;
  console.log(user_id);
  const { book_id, rating, comment } = req.body;


  if (!user_id)
    return res.status(401).json({ message: 'Unauthorized' });

  if (!book_id || !rating)
    return res.status(400).json({ message: 'Book ID and rating are required' });

  if (rating < 1 || rating > 5)
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });

  try {
    const [result] = await connection.execute(
      'INSERT INTO reviews (user_id, book_id, rating, comment) VALUES (?, ?, ?, ?)',
      [user_id, book_id, rating, comment || null]
    );

    res.status(201).json({
      message: 'Review added successfully',
      reviewId: result.insertId
    });
  } catch (err) {
    console.error('Add Review Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const editReview = async (req, res) => {
  const user_id = req.user?.id;
  const { review_id, rating, comment } = req.body;

  if (!user_id)
    return res.status(401).json({ message: 'Unauthorized' });

  if (!review_id)
    return res.status(400).json({ message: 'Review ID is required' });

  if (rating && (rating < 1 || rating > 5))
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });

  try {
    const [existingReview] = await connection.execute(
      'SELECT * FROM reviews WHERE id = ? AND user_id = ?',
      [review_id, user_id]
    );

    if (!existingReview.length)
      return res.status(404).json({ message: 'Review not found or not yours to edit' });

    await connection.execute(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [rating || existingReview[0].rating, comment || existingReview[0].comment, review_id]
    );

    res.status(200).json({ message: 'Review updated successfully' });
  } catch (err) {
    console.error('Edit Review Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteReview = async (req, res) => {
  const user_id = req.user?.id;
  const { review_id } = req.body;

  if (!user_id)
    return res.status(401).json({ message: 'Unauthorized' });

  if (!review_id)
    return res.status(400).json({ message: 'Review ID is required' });

  try {
    const [existingReview] = await connection.execute(
      'SELECT * FROM reviews WHERE id = ?',
      [review_id]
    );

    if (!existingReview.length)
      return res.status(404).json({ message: 'Review not found' });

    if (existingReview[0].user_id !== user_id)
      return res.status(403).json({ message: 'You are not allowed to delete this review' });

    await connection.execute(
      'DELETE FROM reviews WHERE id = ?',
      [review_id]
    );

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Delete Review Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


//for admin
export const editBook = async (req, res) => {
  const user_id = req.user?.id;
  const user_role = req.user?.role;
  const { book_id, title, author, year, availability } = req.body;

  if (!user_id || user_role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can edit books' });
  }

  if (!book_id) {
    return res.status(400).json({ message: 'Book ID is required' });
  }

  try {
    const [existingBook] = await connection.execute(
      'SELECT * FROM books WHERE id = ?',
      [book_id]
    );

    if (!existingBook.length) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await connection.execute(
      `UPDATE books 
       SET title = ?, author = ?, year = ?, availability = ?
       WHERE id = ?`,
      [
        title || existingBook[0].title,
        author || existingBook[0].author,
        year || existingBook[0].year,
        typeof availability === 'boolean' ? availability : existingBook[0].availability,
        book_id
      ]
    );

    res.status(200).json({ message: 'Book updated successfully' });
  } catch (err) {
    console.error('Edit Book Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


export const addBook = async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
  }

  
  const { title, author, year, availability } = req.body;

  if (!title || !author || !year) {
    return res.status(400).json({ message: 'Title, author, and year are required' });
  }

  try {
    const [result] = await connection.execute(
      'INSERT INTO books (title, author, year, availability) VALUES (?, ?, ?, ?)',
      [title, author, year, availability !== undefined ? availability : true]
    );

    res.status(201).json({
      message: 'Book added successfully',
      bookId: result.insertId
    });
  } catch (err) {
    console.error('Add Book Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteBook = async (req, res) => {
  const { bookId } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can delete books' });
  }

  if (!bookId) {
    return res.status(400).json({ message: 'Book ID is required' });
  }

  try {
    const [existing] = await connection.execute('SELECT * FROM books WHERE id = ?', [bookId]);

    if (!existing.length) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await connection.execute('DELETE FROM books WHERE id = ?', [bookId]);

    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};











class APIFeatures {
  constructor(query, queryString) {
    // console.log('💲', query);
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A) Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    // console.log(req.query, queryObj); // ?duration=5&difficulty=easy&page=2&limit=5, { duration: '5', difficulty: 'easy', page: '2', limit: '5' } { duration: '5', difficulty: 'easy' }

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // \b - to match the exact word in regular expression, g - replace multiple times
    this.query.find(JSON.parse(queryStr));
    return this;
    // console.log(queryStr); // ?duration[gte]=5&difficulty=easy&page=2&limit=5&sort=1&price[lte]=1500 -> {"duration":{"$gte":"5"},"difficulty":"easy","price":{"$lte":"1500"}}
  }

  sort() {
    if (this.queryString.sort) {
      // console.log(this.queryString.sort); // if sort key comes mulitple times, express makes it in array [ 'duration', 'price' ], after hpp, using last parameter
      const sortBy = this.queryString.sort.split(',').join(' ');
      // console.log(sortBy); // -price ratingsAverage, -ve means decending
      this.query = this.query.sort(sortBy);
      // sort('price ratingsAverage')
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // console.log(fields); // ?fields=name,duration,difficulty,price -> name duration difficulty price
      this.query = this.query.select(fields); // selecting field name operation called projecting
    } else {
      this.query = this.query.select('-__v'); // - means excluding the field
    }
    return this;
  }

  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = APIFeatures;

/*

exports.getAllTours = async (req, res) => {
  try {
    // const queryObj = req.query; // reference to address, not a shallow copy
    // BUILD QUERY
    // 1A) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    console.log(req.query, queryObj); // ?duration=5&difficulty=easy&page=2&limit=5, { duration: '5', difficulty: 'easy', page: '2', limit: '5' } { duration: '5', difficulty: 'easy' }

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // \b - to match the exact word in regular expression, g - replace multiple times
    // console.log(queryStr); // ?duration[gte]=5&difficulty=easy&page=2&limit=5&sort=1&price[lte]=1500 -> {"duration":{"$gte":"5"},"difficulty":"easy","price":{"$lte":"1500"}}

    // as soon as we await the result of the query, then it execute and come back with the document that match our query so we can implement pagination, sorting
    // so save the part into query and then execute it
    let query = Tour.find(JSON.parse(queryStr));

    // 2) Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      // console.log(sortBy); // -price ratingsAverage, -ve means decending
      query = query.sort(sortBy);
      // sort('price ratingsAverage')
    } else {
      query = query.sort('-createdAt');
    }

    // 3) Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      console.log(fields); // ?fields=name,duration,difficulty,price -> name duration difficulty price
      query = query.select(fields); // selecting field name operation called projecting
    } else {
      query = query.select('-__v'); // - means excluding the field
    }

    // 4) Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await Tour.countDocuments(); // total no of documents
      if (skip >= numTours || page < 0)
        throw new Error('This page does not exist');
    }
    // query.sort().select().skip().limit()

    // EXECUTE QUERY
    const tours = await query;
    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
*/

const Article = require('../models/ArticleModel');


const sharp = require("sharp");
const sequelize = require('sequelize')
const { Op } = require("sequelize")
const buildPaginator = require('pagination-apis')
const jwt = require("jsonwebtoken")
const path = require('path')





const fs = require('fs');
const generateBase64ImageNameAndPath = (base64Image) => {
  const imageName = Date.now().toString() + '.jpeg';
  const imagePath = path.join(__dirname, '..', 'assets', 'images', 'article', imageName);
  // console.log(imagePath);

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(imagePath, buffer, 'base64');

  return { imageName, imagePath };
};



const category = "ARTICLE";
const createArticle = async (req, res) => {
  try {
    const { title_article, writers_name, contents_article, categories, hashtags } = req.body;
    let image = req.body.image
    let avatar = req.body.avatar
    // Validate input
    if (!title_article || !writers_name) {
      return res.status(400).json({ message: "Title and writer's name are required" });
    }
    
    if(!image){image = null}
    if(!avatar){avatar = null}

    // Convert stringified arrays to actual arrays
    const parsedCategories = Array.isArray(categories) ? categories : [];
    const parsedHashtags = Array.isArray(hashtags) ? hashtags : [];
    // Create the article
    const article = await Article.create({
      title_article,
      writers_name,
      image,
      avatar,
      contents_article,
      categories: parsedCategories,
      hashtags: parsedHashtags
    });

    const imagePath = path.join(__dirname, 'assets', 'images', 'article');

    // Buat direktori jika belum ada
    if (!fs.existsSync(imagePath)) {
      fs.mkdirSync(imagePath, { recursive: true });
    }
    
    if (typeof image !== "undefined") {
      if (Array.isArray(image)) {
        for (let i = 0; i < image.length; i++) {
          const { imageName, imagePath } = generateBase64ImageNameAndPath(image[i]);

          try {
            let parts = image[i].split(';')
            let imageData = parts[1].split(',')[1]

            const img = Buffer.from(imageData, 'base64');

            await sharp(img)
              .resize(280, 175)
              .toFormat("jpeg", { mozjpeg: true })
              .jpeg({ quality: 100 })
              .toFile(imagePath);
          } catch (error) {
            console.log(`Handle ERORR = ${error.message} ===> ArticleController ===> Array.isArray(image)`)
            return res.status(500).json({ msg: `Can't convert base64 to jpeg of ${category}'s image and save it into directory. ${error.message}` });
          }
        }
      } else if (typeof image === "string") {
        const { imageName, imagePath } = generateBase64ImageNameAndPath(image);

        // storeImageToDb(imagePath, categories);

        try {
          let parts = image.split(';')
          let imageData = parts[1].split(',')[1]

          const img = Buffer.from(imageData, 'base64');

          await sharp(img)
            .resize(280, 175)
            .toFormat("jpeg", { mozjpeg: true })
            .jpeg({ quality: 100 })
            .toFile(imagePath);
        } catch (error) {
          console.log(`Handle ERORR = ${error.message} ===> ArticleController ===> typeof image === "string"`)
          return res.status(500).json({ msg: `Error when storing image to directory. ${error.message}` });
        }
      }
    }

    if (avatar) {
      const { imageName, imagePath } = generateBase64ImageNameAndPath(avatar);

      try {
        let parts = avatar.split(';');
        let imageData = parts[1].split(',')[1];

        const img = Buffer.from(imageData, 'base64');

        await sharp(img)
          .resize(150, 150)
          .toFormat("jpeg", { mozjpeg: true })
          .jpeg({ quality: 100 })
          .toFile(imagePath);
      } catch (error) {
        console.log(`Handle ERORR = ${error.message} ===> ArticleController ==> avatar`)
        return res.status(500).json({ msg: `Error when storing avatar image to directory. ${error.message}` });
      }
    }


    res.status(201).json({ message: 'Article created successfully', data: article });
  } catch (error) {
    // res.status(400).json({ message: error.message });
    if(error.errors){
      res.status(400).json({
          message: error.errors[0].message
      })
    }else{
        res.status(400).json({
            message: error.message
        })
    }
  }
};






// Get all articles
const getArticles = async (req, res) => {
  try {
    const search = req.query.search || "";
    const sort = req.query.sort || 'ASC';
    const category = req.query.category || ""

    const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit });

    const whereClause = {
      title_article: { [Op.like]: `%${search}%` },
    };

    if (category) {
      if (process.env.DB_DIALECT === 'mysql') { // Check if using PostgreSQL
        whereClause.categories = {
          [Op.contains]: [category]
        };
      } else { // For MariaDB/MySQL
        whereClause.categories = {
          [Op.regexp]: `.*${category}.*`
        };
      }
    }

    const articles = await Article.findAndCountAll({
      where: whereClause,
      order: [['title_article', sort]],
      limit,
      offset: skip
    });

    // Format categories and hashtags
    const formattedArticles = articles.rows.map(article => {
      let categories = [];
      let hashtags = [];
    
      try {
        categories = JSON.parse(article.dataValues.categories || "[]");
        hashtags = JSON.parse(article.dataValues.hashtags || "[]");
      } catch (error) {
        // Handle error here, e.g., log the error or provide a default value
        console.error("Error parsing JSON:", error);
      }
    
      return {
        ...article.dataValues,
        categories: categories,
        hashtags: hashtags
      };
    });
    

    const pagination = paginate(formattedArticles, articles.count);

    res.status(200).json({
      data: formattedArticles,
      pagination: pagination,
      filtering: {
        keyword: search,
        sort: sort,
        category: category
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const getArticlesByCategory = async (req, res) => {
  try {
    const search = req.query.search || "";
    const sort = req.query.sort || 'ASC';
    const category = req.params.category
    const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit });

    const whereClause = {
      title_article: { [Op.like]: `%${search}%` },
    };

    if (category) {
      if (process.env.DB_DIALECT === 'mysql') { // Check if using PostgreSQL
        whereClause.categories = {
          [Op.contains]: [category]
        };
      } else { // For MariaDB/MySQL
        whereClause.categories = {
          [Op.regexp]: `.*${category}.*`
        };
      }
    }

    const articles = await Article.findAndCountAll({
      where: whereClause,
      order: [['title_article', sort]],
      limit,
      offset: skip
    });

    // Format categories and hashtags
    const formattedArticles = articles.rows.map(article => ({
      ...article.dataValues,
      categories: JSON.parse(article.dataValues.categories || "[]"),
      hashtags: JSON.parse(article.dataValues.hashtags || "[]")
    }));

    const pagination = paginate(formattedArticles, articles.count);

    res.status(200).json({
      // data: formattedArticles,
      pagination: pagination,
      filtering: {
        keyword: search,
        sort: sort,
        category: category
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a single article by ID
const getArticleById = async (req, res) => {
  try {
    const articleId = req.params.articleId;

    const article = await Article.findByPk(articleId);

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Format categories and hashtags
    let categories = [];
    let hashtags = [];

    try {
      categories = JSON.parse(article.dataValues.categories || "[]");
      hashtags = JSON.parse(article.dataValues.hashtags || "[]");
    } catch (error) {
      // Handle error here, e.g., log the error or provide a default value
      console.error("Error parsing JSON:", error);
    }

    const formattedArticle = {
      ...article.dataValues,
      categories: categories,
      hashtags: hashtags
    };

    return res.status(200).json(formattedArticle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single article by Slug
const getArticleBySlug = async (req, res) => {
  try {
    const slug = req.params.articleSlug

    function convertSlugToRegularText(slug) {
      const words = slug.split("-");
      const regularText = words.join(" ");
      return regularText;
    }
    const article = await Article.findOne({where: {title_article: convertSlugToRegularText(slug)}});

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    // return res.send(article)
    // Format categories and hashtags
    let categories = [];
    let hashtags = [];

    try {
      categories = JSON.parse(article.dataValues.categories || "[]");
      hashtags = JSON.parse(article.dataValues.hashtags || "[]");
    } catch (error) {
      // Handle error here, e.g., log the error or provide a default value
      console.error("Error parsing JSON:", error);
    }

    const formattedArticle = {
      ...article.dataValues,
      categories: categories,
      hashtags: hashtags
    };

    return res.status(200).json(formattedArticle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an article
const updateArticle = async (req, res) => {
  const articleId = req.params.articleId;

  if (!articleId) {
    return res.status(400).json({
      msg: "Article's id can not be null or undefined.",
    });
  }

  try {
    const { title_article, writers_name, image, contents_article, categories, hashtags, avatar } = req.body;

    const article = await Article.findByPk(articleId);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Update the article
    article.title_article = title_article;
    article.writers_name = writers_name;
    article.image = image;
    article.avatar = avatar;
    article.contents_article = contents_article;
    article.categories = categories.join(',');
    article.hashtags = hashtags.join(',');

    await article.save();

    res.status(200).json({ message: 'Article updated successfully', data: article });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an article
const deleteArticle = async (req, res) => {
    const article = await Article.findOne({
        where: {
            id: req.params.articleId
        },
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Delete the article
    try {
      await Article.destroy({ 
        where: { 
          id: article.id 
        }

        });
    
    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}




module.exports = {getArticles, createArticle, getArticleById, updateArticle, deleteArticle,getArticlesByCategory, getArticleBySlug};
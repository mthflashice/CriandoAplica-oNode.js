const {hash,compare} = require('bcryptjs');
const appError = require("../utils/appError");

const sqliteConnection = require('../../database/sqlite');

class UserController {
  async create(request, response) {
    const { name, email, password } = request.body;

    const database = await sqliteConnection();
    const checkUserExists = await database.get("SELECT * FROM users WHERE email =(?)", [email])

    if(checkUserExists){
        throw new appError(`Este e-mail já é cadastrado `);
    }

    const hashedPassword = await hash(password, 8)

    await database.run("INSERT INTO users(name,email,password) VALUES (?,?,?)",
    [name, email, hashedPassword]
    )
        return response.status(201).json();
  }
async update(request, response){
  const{name, email, password, old_password} = request.body;
  const {id} = request.params;

  const database =await sqliteConnection();
  const user = await database.get("SELECT* FROM users WHERE id=(?)", [id]);

  if(!user){
    throw new appError('Usuário não encontrado');
  }

  const userWithUpdatedEmail = await database.get("SELECT* FROM users WHERE email = (?)", [email])

  if(userWithUpdatedEmail &&userWithUpdatedEmail.id!==user.id){
    throw new appError('Este email já está em uso');

  }
  user.name = name ?? user.name;
  user.email= email ?? user.email;



  if(password && !old_password ){
    throw new appError('Você precisa informar sua senha antiga para definir a nova senha ');
  }

  if(password && old_password){
    const checkOldPassword = await compare(old_password, user.password);

    if(!checkOldPassword){
      throw new appError('A senha antiga não confere');
    }

    user.password = await hash(password, 8);
  }

  await database.run(`
  UPDATE users SET
  name = ?,
  email = ?,
  password = ?,
  updated_at =  DATETIME('now')
  WHERE id = ?`,
  [user.name, user.email,user.password, id])

  return response.json();
};


}


// response.send(`usuário: ${name}, Email: ${email}, E a senha: ${password}`);


module.exports = UserController;

/*  Métodos da CLASS
- Index - GET para listas vários registro.
- show - GEt para exibir um registro especifico
- create - POST para um registro.
- update - PUT para atualizar um registro.
- delete - DELETE para remover um registro 

*/

## users

#### create user

`POST /users`
```bash
{
  "email": "",
  "password": "",
  ...
}
```

Bu istek başarılı olunca size bir user dönecektir. Ancak bu user login olamaz.
Öncelikle verify edilmelidir. Bunun için kendisine email gönderilir.

#### verify user

`GET /users/:user_id/verify/:email_verification_key`

Verify user sadece bir get isteğidir. User yaratılırken dönen email_verification_key adreste gönderilerek yapılır.

#### login user

POST /users/login
```bash
{
  "email": "",
  "password": ""
}
```

Bu isteği attıktan sonra size token ve user dönecektir. Kullanıcı ile attığınız her istekte headerda size dönen tokenı kullanmalısınız.

```
Authorization: Bearer <token>
```

#### clone user

`POST /users/:user_id/clone`

Farklı olmasını istediğiniz alanları body de gönderin. Bu sayede ikinci bir kullanıcı yaratırsınız.
Yarattığınız kullanıcının içinde connected_profile_id alanı sizi asıl user modeliyle bağlar.
Asıl user modeli içinde secret_profile_id ise sizi dark usera götürür.

Kullanmak için headerda `who` keyine `dark` yollamanız yeterlidir.

#### get user

`GET /users/:user_id`

Herhangi bir kullanıcının profil bilgilerini görüntülemek için bu isteği atmalısınız.
Ancak kullanıcının profili privacy_profile ise size sadece temel bilgiler dönecektir.

#### list users

`GET /users`

Bu istek size kullanıcı listesini verir. Filtrelemek için query params yollamalısınız.
Aynı zamanda sort ve pagination işlemleri yapabilirsiniz.

| field             | type            | description                   |
| :---------------- | :-------------- | :---------------------------- |
| first_name        | string          | like metodu ile arar          |
| last_name         | string          | like metodu ile arar          |
| email             | string          | -                             |
| role              | string          | "admin", "therapist", "person"|
| verified          | string          | "true", "false"               |
| privacy_profile   | string          | "true", "false"               |
| fcm_token         | string          | fcm token info                |
| followers         | []string        | ["obj_id_1", "obj_id_2", ...] |
| following         | []string        | ["obj_id_1", "obj_id_2", ...] |
| communities       | []string        | ["obj_id_1", "obj_id_2", ...] |
| therapists        | []string        | ["obj_id_1", "obj_id_2", ...] |
| start_birthday_at | date string     | -                             |
| end_birthday_at   | date string     | -                             |
| start_created_at  | date string     | -                             |
| end_created_at    | date string     | -                             |
| start_updated_at  | date string     | -                             |
| end_updated_at    | date string     | -                             |

sorting için sort_by kısmına sıralamak istediğiniz alanın adını yazın. sort_type için 1 veya -1 yollayın.
Varsayılan olarak created_at fieldı azalan sıralanacaktır. sort_by=created_at&sort_type=-1

#### near users

`GET /users/near`

list metoduyla aynı şekilde çalışır. aynı filtreleri bu metod ile kullanabilirsiniz.
location araması için örnek filtre:

`location=[41.066214,28.9258483]&limit=5&max_distance=9000`

- location: yakın yerleri bulmak istediğiniz nokta(lat,long)
- limit: kaç kullanıcının geleceğini belirtin.(max)
- max_distance: metre cinsinden nereye kadar arayacağını seçin.

bu istekte kullanıcıların dönmesi için kullanıcı verisinde location bilgisi olmalıdır. bunun olabilmesi içim kullanıcı update edilmelidir.

`PUT /users/:userId`

```
{
	"location": {
        "coordinates": [
            41.0054958,
            28.8720983
        ]
    }
}
```

#### update user

`PUT /users/:user_id`
```bash
{
  "first_name": "",
  "last_name": "",
  ...
}
```

Bu metodu sadece kişisel bilgiler için kullanın.

#### add profile image

`POST /users/:user_id/profile_image`

Post içerisinde `file_item` parametresi gönderilir. Header içerisinde `Content-Type` parametresi
`multipart/form-data` olarak gönderilmelidir. Gönderilen `file_type` parametresi file tipinde olmalıdır.

#### add cover image

`POST /users/:user_id/cover_image`

Post içerisinde `file_item` parametresi gönderilir. Header içerisinde `Content-Type` parametresi
`multipart/form-data` olarak gönderilmelidir. Gönderilen `file_type` parametresi file tipinde olmalıdır.

#### follow user

`POST /users/:user_id/follow`
```bash
{
  "follow_user_id": ""
}
```

Eğer ekleyeceği profil privacy_profile değilse `HTTP Status Code 200` dönecektir.
Aksi durumda yeni bir request objesi yaratılır. Yaratılan request ile birlikte `HTTP Status Code 201` dönecektir.

#### unfollow user

`DELETE /users/:user_id/unfollow`
```bash
{
  "unfollow_user_id": ""
}
```

unfollow_user_id following listesinden silinir.

#### join community

`POST /users/:user_id/community`
```bash
{
  "community_id": ""
}
```

#### left community

`DELETE /users/:user_id/community`
```bash
{
  "community_id": ""
}
```

community_id listesinden silinir.

#### join event

`POST /users/:user_id/event`
```bash
{
  "event_id": ""
}
```

#### left event

`DELETE /users/:user_id/event`
```bash
{
  "event_id": ""
}
```

event_id listesinden silinir.

#### add blacklist

`POST /users/:user_id/black_list`
```bash
{
  "blacked_user_id": ""
}
```

#### remove blacklist

`DELETE /users/:user_id/black_list`
```bash
{
  "blacked_user_id": ""
}
```

#### add therapist

`POST /users/:user_id/therapist`
```bash
{
  "therapist_id": ""
}
```

Yaratılan request ile birlikte `HTTP Status Code 201` dönecektir.

#### remove therapist

`DELETE /users/:user_id/therapist`
```bash
{
  "therapist_id": ""
}
```

#### change password

`PUT /users/:user_id/change_password`
```bash
{
  "password": "",
  "repeat_password": "",
  ...
}
```

#### forgot password

`POST /users/forgot_password`

```bash
{
  "email": ""
}
```

## posts

#### create post

`POST /posts`
```bash
{
  "text": ""
  ...
}
```

Dosyaları ayrı olarak yükleyin.
Eğer istek içerisinde community_id yer alırsa bu post o community'e ait olacaktır.
Ancak community_id boş olursa bu kullanıcının kendi profiline yazdığı bir postdur.

#### get post

`GET /posts/:post_id`

#### list posts

`GET /posts`

Bu istek size post listesini verir. Filtrelemek için query params yollamalısınız.
Aynı zamanda sort ve pagination işlemleri yapabilirsiniz.

| field             | type            | description                   |
| :---------------- | :-------------- | :---------------------------- |
| community_id      | []string        | ["obj_id_1", "obj_id_2", ...] |
| user_id           | []string        | ["obj_id_1", "obj_id_2", ...] |
| likes             | []string        | ["obj_id_1", "obj_id_2", ...] |
| start_created_at  | date string     | -                             |
| end_created_at    | date string     | -                             |
| start_updated_at  | date string     | -                             |
| end_updated_at    | date string     | -                             |

sorting için sort_by kısmına sıralamak istediğiniz alanın adını yazın. sort_type için 1 veya -1 yollayın.
Varsayılan olarak created_at fieldı azalan sıralanacaktır. sort_by=created_at&sort_type=-1

Örnek: bir community'nin akışını çekmek için community_id'ye çekmek istediğiniz id bilgisini verin.
Örnek: bir kullanıcının kendi postlarını görüntülemek için user_id'ye çekmek istediğiniz id bilgisini verin.

 - feed için filtre olarak `feed=true` yollamalısınız.
 - community_feed için filtre olarak `community_feed=true` yollamalısınız.
 - eğer community'e ait olmayan postları çekmek istiyorsanız filtre olarak `none_community=true` yollamalısınız. `feed=true` filtersi yollarsanız bu filtre otomatik eklenir.

Bu işlemi community_id içinde yapabilirsiniz. Yada 10 ondan 10 tane diğerinden çekerek karışık bir feed elde edebilirsiniz.

#### update post

`PUT /posts/:post_id`
```bash
{
  "text": ""
  ...
}
```

Dosyaları güncelleyemezsiniz.

#### delete post

`DELETE /posts/:post_id`

Cevap olarak `HTTP Status 204` dönmesini bekleyin.

#### like post

`POST /posts/:post_id/like`

Post içerisinde likes listesine user_id'ler eklenir. Bu sayede bir postu kaç kişinin beğendiğini
like.length ile bulabildiğiniz gibi kimlerin beğendiğinide bulabilirsiniz.

#### unlike post

`DELETE /posts/:post_id/like`

#### add image to post

`POST /posts/:post_id/image`

Post içerisinde `file_item` parametresi gönderilir. Header içerisinde `Content-Type` parametresi
`multipart/form-data` olarak gönderilmelidir. Gönderilen `file_type` parametresi file tipinde olmalıdır.

#### remove image to post

`DELETE /posts/:post_id/image`
```bash
{
  "file_item": ""
}
```

Delete isteği içerisinde json formatlı olarak elimizdeki image url bilgisi gönderilir.
Gönderilen istek içirisindeki parametre `file_item` olmalıdır. Cevap olarak Pos bilgisi dönmektedir.

#### add video to post

`POST /posts/:post_id/video`

Post içerisinde `file_item` parametresi gönderilir. Header içerisinde `Content-Type` parametresi
`multipart/form-data` olarak gönderilmelidir. Gönderilen `file_type` parametresi file tipinde olmalıdır.

#### remove video to post

`DELETE /posts/:post_id/video`
```bash
{
  "file_item": ""
}
```
Delete isteği içerisinde json formatlı olarak elimizdeki video url bilgisi gönderilir.
Gönderilen istek içirisindeki parametre `file_item` olmalıdır. Cevap olarak Pos bilgisi dönmektedir.

## comments

#### create comment

`POST /comments`
```bash
{
  "text": "",
  "post_id": ""
  ...
}
```

Bu tarz isteklerde user_id 'nin tokendan çekileceğini unutmayın.

#### get comment

`GET /comments/:comment_id`

#### list comments

`GET /comments`

Bu istek size comment listesini verir. Filtrelemek için query params yollamalısınız.
Aynı zamanda sort ve pagination işlemleri yapabilirsiniz.

| field             | type            | description                   |
| :---------------- | :-------------- | :---------------------------- |
| post_id           | string          | -                             |
| user_id           | string          | -                             |
| start_created_at  | date string     | -                             |
| end_created_at    | date string     | -                             |
| start_updated_at  | date string     | -                             |
| end_updated_at    | date string     | -                             |

sorting için sort_by kısmına sıralamak istediğiniz alanın adını yazın. sort_type için 1 veya -1 yollayın.
Varsayılan olarak created_at fieldı azalan sıralanacaktır. sort_by=created_at&sort_type=-1

#### update comment

`PUT /comments/:comment_id`
```bash
{
  "text": ""
  ...
}
```

Dosyaları güncelleyemezsiniz.

#### delete comment

`DELETE /comments/:comment_id`

Cevap olarak `HTTP Status 204` dönmesini bekleyin.


## communities

#### create community

`POST /communities`
```bash
{
  "name": "",
  "category_id": ""
}
```

Bu tarz isteklerde user_id 'nin tokendan çekileceğini unutmayın.

#### get community

`GET /communities/:community_id`

#### list communities

`GET /communities`

Bu istek size community listesini verir. Filtrelemek için query params yollamalısınız.
Aynı zamanda sort ve pagination işlemleri yapabilirsiniz.

| field             | type            | description                   |
| :---------------- | :-------------- | :---------------------------- |
| name              | string          | -                             |
| start_created_at  | date string     | -                             |
| end_created_at    | date string     | -                             |
| start_updated_at  | date string     | -                             |
| end_updated_at    | date string     | -                             |

sorting için sort_by kısmına sıralamak istediğiniz alanın adını yazın. sort_type için 1 veya -1 yollayın.
Varsayılan olarak created_at fieldı azalan sıralanacaktır. sort_by=created_at&sort_type=-1

#### update community

`PUT /communities/:community_id`
```bash
{
  "text": ""
  ...
}
```

Dosyaları güncelleyemezsiniz.

#### delete community

`DELETE /communities/:community_id`

Cevap olarak `HTTP Status 204` dönmesini bekleyin.


## events

#### create event

`POST /events`
```bash
{
  "name": "",
  "premise_name":"",
  "community_id":"",
  "description": "",
  "cover_image": "",
  "address": "",
  "organizer_id": "",
  "dating_at": ""
}
```

#### get event

`GET /events/:event_id`

#### list events

`GET /events`

Bu istek size event listesini verir. Filtrelemek için query params yollamalısınız.
Aynı zamanda sort ve pagination işlemleri yapabilirsiniz.

| field             | type            | description                   |
| :---------------- | :-------------- | :---------------------------- |
| name              | string          | -                             |
| organizer_id      | string          | -                             |
| attendances       | [string]        | -                             |
| noneattendances   | [string]        | -                             |
| start_dating_at   | date string     | -                             |
| end_dating_at     | date string     | -                             |
| start_created_at  | date string     | -                             |
| end_created_at    | date string     | -                             |
| start_updated_at  | date string     | -                             |
| end_updated_at    | date string     | -                             |

sorting için sort_by kısmına sıralamak istediğiniz alanın adını yazın. sort_type için 1 veya -1 yollayın.
Varsayılan olarak created_at fieldı azalan sıralanacaktır. sort_by=created_at&sort_type=-1

#### update event

`PUT /events/:event_id`
```bash
{
  "name": ""
  ...
}
```

#### delete event

`DELETE /events/:event_id`

Cevap olarak `HTTP Status 204` dönmesini bekleyin.


## requests

#### create request

`POST /requests`
```bash
{
  "from_user_id": ""
  "to_user_id": "",
  "post_id": ""
}
```

Follow ve Therapist Requestleri sistem tarafından otomatik oluşturulur. Burayı kullanmanıza gerek yoktur.

 - `report_user`:
 {
   "from_user_id": "<id of user who make report>",
   "to_user_id": "",
   "type": "report_user"
 }

 - `report_post`:
 {
   "from_user_id": "<id of user who make report>",
   "to_user_id": "<post_owner_id>",
   "post_id": "",
   "type": "report_post"
 }

 - `report_comment`:
 {
   "from_user_id": "<id of user who make report>",
   "to_user_id": "<comment_owner_id>",
   "post_id": "",
   "type": "report_comment"
 }

#### get request

`GET /requests/:request_id`

#### approve request

`PUT /requests/:request_id/approve`

Bu isteği attığınızda api gerekli işlemleri yapacaktır. Follow ve Therapist işlemlerinde user modeline gerekli veriler işlenip update edilecektir. Report işlemlerindeyse user,post veya comment silinir.

#### list requests

`GET /requests`

Bu istek size community listesini verir. Filtrelemek için query params yollamalısınız.
Aynı zamanda sort ve pagination işlemleri yapabilirsiniz.

| field             | type            | description                   |
| :---------------- | :-------------- | :---------------------------- |
| from_user_id      | string          | -                             |
| to_user_id        | string          | -                             |
| type              | string          | "friend", "therapist"         |
| status            | string          | "approved", "waiting"         |
| start_created_at  | date string     | -                             |
| end_created_at    | date string     | -                             |
| start_updated_at  | date string     | -                             |
| end_updated_at    | date string     | -                             |

sorting için sort_by kısmına sıralamak istediğiniz alanın adını yazın. sort_type için 1 veya -1 yollayın.
Varsayılan olarak created_at fieldı azalan sıralanacaktır. sort_by=created_at&sort_type=-1

#### delete request

`DELETE /requests/:request_id`

Cevap olarak `HTTP Status 204` dönmesini bekleyin.

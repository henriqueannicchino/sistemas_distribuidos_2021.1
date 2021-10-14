import pymongo
from pymongo import MongoClient
from bson.objectid import ObjectId

import os
#import logging
import base64

from telegram import ReplyKeyboardMarkup, ReplyKeyboardRemove, Update, Location
from telegram.ext import (
    Updater,
    CommandHandler,
    MessageHandler,
    Filters,
    ConversationHandler,
    CallbackContext,
)

cluster = MongoClient(" ")
db = cluster["missingOnes"]
collection = db["missingones"]

#logging.basicConfig(
#    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO
#)

#logger = logging.getLogger(__name__)

MENU, PHOTO, LOCATION, DATE, BIO, DeleteMissingOne = range(6)

newImage64 = ''
newLocation = ''
newDate = ''

def start(update: Update, context: CallbackContext):
    user = update.message.from_user
    #logger.info("name of user is %s", user.first_name)
    #logger.info("id of user is %s", user.id)
    
    update.message.reply_text(
        '/cadastrarDesaparecido\n/listarDesaparecidos(lista desaparecidos cadastrados por este usuário)\n/removerDesaparecido(somente desaparecidos cadastrados por este usuário)\n'
        '/encerrar',
        reply_markup=ReplyKeyboardRemove(),
    )
    
    return MENU


def menu(update: Update, context: CallbackContext):
    user = update.message.from_user

    if update.message.text == "/cadastrarDesaparecido":
        update.message.reply_text(
            'Envie uma foto do desaparecido, '
            'para que possa ser mostrado em nosso site',
            reply_markup=ReplyKeyboardRemove(),
        )

        return PHOTO

    elif update.message.text == "/listarDesaparecidos":
        missingAmount = collection.count_documents({"userId":user.id})
        if missingAmount>0:
            results = collection.find({"userId":user.id},{ "_id": 1, "missingName": 1 })
            res=''
            #construir uma msg com o id e nome de todos os sumidos cadastrados pelo usuario usando um loop
            for i in range(missingAmount):
                res+=f"* id:{results[i]['_id']}, nome: {results[i]['missingName']}\n"

            update.message.reply_text(
                res,
            )

            update.message.reply_text(
                '/cadastrarDesaparecido\n/listarDesaparecidos(lista desaparecidos cadastrados por este usuário)\n/removerDesaparecido(somente desaparecidos cadastrados por este usuário)\n'
                '/encerrar',
                reply_markup=ReplyKeyboardRemove(),
            )
        
        return MENU

    elif update.message.text == "/removerDesaparecido":
        update.message.reply_text(
            'Envie o id da pessoa que estava desaparecida\n'
            'Caso deseje visualizar os id das pessoas desaparecidas cadastradas por você digite /listarDesaparecidos',
            reply_markup=ReplyKeyboardRemove(),
        )

        return DeleteMissingOne
            
    elif(update.message.text == "/encerrar"):
        update.message.reply_text(
            'Digite /start para usar o bot novamente', reply_markup=ReplyKeyboardRemove()
        )

        return ConversationHandler.END
    

def photo(update: Update, context: CallbackContext):
    user =  update.message.from_user
    photo_file = update.message.photo[-1].get_file()
    global newImage64
    
    photo_file.download('missing_one.jpg')
    new_image = open('missing_one.jpg', 'rb')
    image_read = new_image.read()
    new_image.close()
    os.remove("missing_one.jpg")
    image_64_encode = base64.encodebytes(image_read)
    newImage64 = image_64_encode
    #print(image_64_encode)
    
    #logger.info("Photo of %s: %s", user.first_name, 'user_photo.jpg')
    update.message.reply_text(
        'Por favor nós envie a localização de onde a pessoa foi vista pela última vez.',
    )

    return LOCATION

def location(update: Update, context: CallbackContext):
    global newLocation
    user = update.message.from_user
    user_location = update.message.location
    
    newLocation = user_location
    
    #logger.info(
    #    "Location of %s: %f / %f", user.first_name, user_location.latitude, user_location.longitude
    #)
    update.message.reply_text(
        'Por favor nós envie o dia do desaparecimento da pessoa no formato\n dd/mm/yyyy.'
    )

    return DATE

def getDate(update: Update, context: CallbackContext):
    global newDate

    newDate = update.message.text

    update.message.reply_text(
        'Quase lá, nós envie o nome da pessoa desaparecida.'
    )
    
    return BIO
    

def bio(update: Update, context: CallbackContext):
    global newImage64
    global newLocation
    global newDate
    
    user = update.message.from_user

    post = {"userId": user.id, "missingName": update.message.text, "missingDay": newDate, "image": newImage64, "longitude": newLocation.longitude, "latitude": newLocation.latitude}
    collection.insert_one(post)
    
    #logger.info("postado por %s: %s", user.first_name, update.message.text)
    update.message.reply_text(
        'Pessoa desapericida cadastrada, vc pode ver o mapa das pessoas desaparecidas '
        'em nosso site.'    
    )

    update.message.reply_text(
        '/cadastrarDesaparecido\n/listarDesaparecidos(lista desaparecidos cadastrados por este usuário)\n/removerDesaparecido(somente desaparecidos cadastrados por este usuário)\n'
        '/encerrar',
        reply_markup=ReplyKeyboardRemove(),
    )
    return MENU


def deleteData(update: Update, context: CallbackContext):
    user = update.message.from_user

    if update.message.text == "/listarDesaparecidos":
        
        missingAmount = collection.count_documents({"userId":user.id})
        if missingAmount>0:
            results = collection.find({"userId":user.id},{ "_id": 1, "missingName": 1 })
            res=''
            
            for i in range(missingAmount):
                res+=f"* id:{results[i]['_id']}, nome: {results[i]['missingName']}\n"

            update.message.reply_text(
                res,
            )

            update.message.reply_text(
                '/cadastrarDesaparecido\n/listarDesaparecidos(lista desaparecidos cadastrados por este usuário)\n/removerDesaparecido(somente desaparecidos cadastrados por este usuário)\n'
                '/encerrar',
                reply_markup=ReplyKeyboardRemove(),
            )

    else:
        missingAmount = collection.count_documents({"userId":user.id, "_id":ObjectId(update.message.text)})
        
        if missingAmount==0:
            update.message.reply_text(
                'Não foi possível localizar uma pessoa desaparecida cadastrada por este usuário com este id.'
            )
        else:
            collection.delete_one({"_id":ObjectId(update.message.text), "userId":user.id})
            update.message.reply_text(
                'Pessoa desaparecida removida.',
                reply_markup=ReplyKeyboardRemove(),
            )

            update.message.reply_text(
                '/cadastrarDesaparecido\n/listarDesaparecidos(lista desaparecidos cadastrados por este usuário)\n/removerDesaparecido(somente desaparecidos cadastrados por este usuário)\n'
                '/encerrar',
                reply_markup=ReplyKeyboardRemove(),
            )

    return MENU
    


def encerrar(update: Update, context: CallbackContext):
    user = update.message.from_user
    #logger.info("User %s canceled the conversation.", user.first_name)
    update.message.reply_text(
        'reach us vack if you have any query', reply_markup=ReplyKeyboardRemove()
    )

    return ConversationHandler.END



def main():
    updater = Updater(" ")
    dispatcher = updater.dispatcher


    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            MENU: [MessageHandler(Filters.text, menu)],
            PHOTO: [MessageHandler(Filters.photo, photo)],
            LOCATION: [MessageHandler(Filters.location, location)],
            DATE: [MessageHandler(Filters.text & ~Filters.command, getDate)],
            BIO: [MessageHandler(Filters.text & ~Filters.command, bio)],
            DeleteMissingOne: [MessageHandler(Filters.text, deleteData)]
        },
        fallbacks=[CommandHandler('encerrar', encerrar)],
    )

    dispatcher.add_handler(conv_handler)

    updater.start_polling()



    updater.idle()
    
main()













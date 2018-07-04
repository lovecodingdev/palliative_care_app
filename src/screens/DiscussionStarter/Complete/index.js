import React, { Component } from 'react';
import {
    Image,
    ImageBackground,
    FlatList,
    View,
    Alert,
    Share,
    ScrollView,
} from 'react-native';
import {Colors, Images, FontSizes} from '@theme';
import Styles from './styles';
import {Button, Text, Loader } from '@components';
import { EmailModal, EmailSentModal, DownloadedModal} from '../../modals';

import {postDiscussionAnswers} from "@api";
import {getSharingHTMLFromResult} from "./HtmlResult";
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Mailer from 'react-native-mail';
import { Card } from '@components';
import { deviceWidth } from "@ResponsiveDimensions";

export default class Complete extends Component {
    constructor(props) {
        super(props);
        const {discussionStarter} = this.props.navigation.state.params
        const activities = discussionStarter.discussion_starter
        console.log(discussionStarter)
        this.state = ({
            discussionStarter: discussionStarter,
            activities: activities,
            activityCount: activities.length,
            loaderVisible: false,
            modalVisible: {
                share: false,
                downloaded: false,
                email: false,
                emailSent: false,
            },
        })
    }

    openModal(modal){
        this.closeModal()
        setTimeout(() => {
            this.setState({
                modalVisible: {
                    share: false,
                    downloaded: false,
                    email: false,
                    emailSent: false,
                    ...modal,
                }
            })                
        }, 500);
    }

    closeModal(){
        this.setState({
            modalVisible: {
                share: false,
                downloaded: false,
                email: false,
                emailSent: false,
            }
        })
    }

    async onExit(){
        this.setState({loaderVisible: true})
        await postDiscussionAnswers(this.state.discussionStarter)
        this.setState({loaderVisible: false})

        setTimeout(()=>{
            const {navigate, goBack} = this.props.navigation
            Alert.alert(
                'Are you sure?',
                'Any information you have entered will be deleted.',
                [
                    {text: 'NO', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                    {text: 'YES', onPress: () => {
                        goBack("DiscussionStarter")
                    }},
                ],
                { cancelable: false }
            )
        }, 500)
    }

    async onShare(){
        this.setState({loaderVisible: true})
        await postDiscussionAnswers(this.state.discussionStarter)
        this.setState({loaderVisible: false})
        this.openModal({share: true})
    }

    async onShareEmail() {

        var html = getSharingHTMLFromResult(this.state.discussionStarter)

        let options = {
            html: html,
            fileName: 'results',
            directory: 'docs',
        };
    
        let file = await RNHTMLtoPDF.convert(options)
        Mailer.mail({
            subject: 'Discussion Starter Results',
            recipients: [],
            body: '<b>Resuls as pdf attach</b>',
            isHTML: true,
            attachment: {
              path: file.filePath,  // The absolute path of the file from which to read data.
              type: 'pdf',   // Mime Type: jpg, png, doc, ppt, html, pdf, csv
              name: 'results.pdf',   // Optional: Custom filename for attachment
            }
        }, (error, event) => {

        });
    }

    async onShareDownload() {
        this.closeModal()

        var html = getSharingHTMLFromResult(this.state.discussionStarter)
        console.log(html)

        let options = {
            html: html,
            fileName: 'test',
            directory: 'docs',
        };
    
        let file = await RNHTMLtoPDF.convert(options)
        console.log(file.filePath)
        setTimeout(() => {
            Share.share({
                title: "Share this!",
                message: "I just wanted to show you this:",
                url: file.filePath,
                subject: "I am only visible for emails :(",
            })
        }, 500);
    }

    onSendEmail(name, email){
        this.openModal({emailSent: true})
    }

    onShareCancel() {
        this.closeModal()
    }

    onEdit(activityIndex) {
        const {navigate, goBack} = this.props.navigation
        // if(activityIndex < this.state.activityCount - 1){
        //     goBack(`UpNext${activityIndex}`)
        // }else{
        //     goBack()
        // }
        navigate("Activity", {editFromResults: true, activityIndex, discussionStarter: this.state.discussionStarter})
    }

    renderActivityItem({item, index}){
        return (
            <View style={Styles.currentWrapper}>
                <View style={Styles.current}>
                    <View style={Styles.currentHeader}>
                        <View style={{flexDirection: 'row'}}>
                            <Image source={Images.check} style={Styles.checkIcon}/>
                            <Text medium bold color={'#fff'} style={Styles.complete_text}>
                                Complete
                            </Text>
                        </View>
                        <Button light color={'#fff'} onPress={()=>this.onEdit(index)}>EDIT</Button>
                    </View>
                    <View style={Styles.currentDescView}>
                        <Text medium color={Colors.Navy} style={Styles.currentTitle}>Activity {index + 1}: {item.stage}</Text>
                        <Text style={Styles.currentPrecomment}>
                            {item.pre_commencement_text} 
                        </Text>
                    </View>
                </View>
            </View>
        )
    }

    render() { 
        return (
            <ImageBackground source={Images.bg_discussion_starter}  style={Styles.container}>
                <Loader loading={this.state.loaderVisible}/>
                <ScrollView contentContainerStyle={Styles.contentView}>
                    <Card topbar style={Styles.titleView} contentStyle={{paddingVertical: deviceWidth(4),}}>
                        <Text mediumLarge center color={Colors.Red} style={{fontWeight: '300'}}>Your Results</Text>
                    </Card>
                    <FlatList
                        data = {this.state.activities}
                        renderItem = {this.renderActivityItem.bind(this)}
                        keyExtractor = {(item, index) => index.toString()}
                        contentContainerStyle={Styles.flatList}
                        ListFooterComponent = {()=>
                            <View style={Styles.saveView}>
                                <Text medium bold center color={Colors.Navy} style={Styles.currentTitle}>Save your results</Text>
                                <Text bold center style={{marginVertical: 8}}>Personal information will not be stored or used by Palliative Care Australia in any way. Read more here</Text>
                                <View style={{flexDirection: 'row', paddingHorizontal: 8, justifyContent: 'center'}}>
                                    <Button dark bold buttonStyles={{paddingHorizontal: 32}} onPress={this.onShareDownload.bind(this)}>Export</Button>
                                    <Button dark bold buttonStyles={{paddingHorizontal: 32}} onPress={this.onShareEmail.bind(this)}>Email</Button>
                                </View>
                            </View>}
                        />
                    
                </ScrollView>
                <View style={Styles.buttonBar}>
                    <Button light bold onPress={this.onExit.bind(this)}>Exit</Button>
                </View>
                <EmailModal 
                    visible={this.state.modalVisible.email} 
                    onSend={this.onSendEmail.bind(this)}
                    onCancel={this.onShareCancel.bind(this)}
                    />
                <EmailSentModal 
                    visible={this.state.modalVisible.emailSent} 
                    onCancel={this.onShareCancel.bind(this)}
                    />
                <DownloadedModal 
                    visible={this.state.modalVisible.downloaded} 
                    onCancel={this.onShareCancel.bind(this)}
                    />
            </ImageBackground>
        );
    }
}